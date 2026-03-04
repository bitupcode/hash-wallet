import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  Transaction,
  TransactionStatus,
  MpcSession,
  SignerRole,
} from "@/types"
import {
  NETWORK_FEE,
  MPC_DEADLINE_MINUTES,
  REQUIRED_SIGNATURES,
} from "@/types"
import { generateId, generateTxHash, generateKytScore } from "@/lib/utils"
import { useAddressStore } from "./address-store"
import { useAuditStore } from "./audit-store"

interface CreateTransactionParams {
  fromAddressId: string
  fromAddress: string
  toAddress: string
  amount: number
  comment: string
  kytScore: number
}

interface TransactionStore {
  transactions: Transaction[]
  mpcSessions: MpcSession[]
  setTransactions: (transactions: Transaction[]) => void
  setMpcSessions: (sessions: MpcSession[]) => void
  createTransaction: (params: CreateTransactionParams) => Transaction | null
  cancelTransaction: (id: string) => boolean
  signTransaction: (txId: string, signer: SignerRole, approve: boolean) => void
  checkDeadlines: () => void
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      mpcSessions: [],
      setTransactions: (transactions) => set({ transactions }),
      setMpcSessions: (sessions) => set({ mpcSessions: sessions }),

      createTransaction: (params) => {
        const { fromAddressId, fromAddress, toAddress, amount, comment, kytScore } = params
        const addressStore = useAddressStore.getState()
        const source = addressStore.addresses.find((a) => a.id === fromAddressId)
        if (!source) return null
        if (amount <= 0) return null
        if (amount + NETWORK_FEE > source.balance) return null
        if (fromAddress === toAddress) return null

        // Determine type
        const isInternal = addressStore.addresses.some((a) => a.address === toAddress)
        const txId = generateId()
        const mpcId = generateId()

        const deadline = new Date(
          Date.now() + MPC_DEADLINE_MINUTES * 60000
        ).toISOString()

        const newTx: Transaction = {
          id: txId,
          type: isInternal ? "INTERNAL" : "EXTERNAL",
          fromAddressId,
          fromAddress,
          toAddress,
          amount,
          fee: NETWORK_FEE,
          status: "WAITING_MPC",
          txHash: null,
          kytScore,
          comment,
          mpcSessionId: mpcId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const newSession: MpcSession = {
          id: mpcId,
          transactionId: txId,
          deadline,
          signersApproved: [],
          signersRejected: [],
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          transactions: [newTx, ...state.transactions],
          mpcSessions: [newSession, ...state.mpcSessions],
        }))

        useAuditStore.getState().addLog({
          actor: "Оператор",
          action: "Создание транзакции",
          entityType: "transaction",
          entityId: txId,
          details: `${amount} BTC → ${toAddress.slice(0, 10)}... (${isInternal ? "внутренний" : "внешний"})`,
        })

        return newTx
      },

      cancelTransaction: (id) => {
        const state = get()
        const tx = state.transactions.find((t) => t.id === id)
        if (!tx) return false

        const session = state.mpcSessions.find((s) => s.id === tx.mpcSessionId)
        if (session) {
          if (session.signersApproved.length > 0 || session.signersRejected.length > 0) {
            return false
          }
        }

        if (tx.status !== "WAITING_MPC") return false

        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id
              ? { ...t, status: "REJECTED" as const, updatedAt: new Date().toISOString() }
              : t
          ),
        }))

        useAuditStore.getState().addLog({
          actor: "Оператор",
          action: "Отмена транзакции",
          entityType: "transaction",
          entityId: id,
          details: `Транзакция отменена оператором`,
        })

        return true
      },

      signTransaction: (txId, signer, approve) => {
        const state = get()
        const tx = state.transactions.find((t) => t.id === txId)
        if (!tx || !tx.mpcSessionId) return
        if (tx.status !== "WAITING_MPC" && tx.status !== "MPC_SIGNING") return

        const session = state.mpcSessions.find((s) => s.id === tx.mpcSessionId)
        if (!session) return

        // Check if already voted
        if (
          session.signersApproved.includes(signer) ||
          session.signersRejected.includes(signer)
        )
          return

        const newApproved = approve
          ? [...session.signersApproved, signer]
          : session.signersApproved
        const newRejected = approve
          ? session.signersRejected
          : [...session.signersRejected, signer]

        let newStatus: TransactionStatus = tx.status
        let txHash = tx.txHash

        if (newApproved.length >= REQUIRED_SIGNATURES) {
          // Completed — deduct balance
          newStatus = "COMPLETED"
          txHash = generateTxHash()
          useAddressStore.getState().deductBalance(tx.fromAddressId, tx.amount + tx.fee)
        } else if (newRejected.length >= 2) {
          // Can't reach quorum
          newStatus = "REJECTED"
        } else {
          newStatus = "MPC_SIGNING"
        }

        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === txId
              ? { ...t, status: newStatus, txHash, updatedAt: new Date().toISOString() }
              : t
          ),
          mpcSessions: state.mpcSessions.map((s) =>
            s.id === session.id
              ? { ...s, signersApproved: newApproved, signersRejected: newRejected }
              : s
          ),
        }))

        const signerName = signer === "signer1" ? "Signer 1" : signer === "signer2" ? "Signer 2" : "Signer 3"

        useAuditStore.getState().addLog({
          actor: signerName,
          action: approve ? "Подтверждение транзакции" : "Отклонение транзакции",
          entityType: "transaction",
          entityId: txId,
          details: approve
            ? `Подпись ${newApproved.length}/${REQUIRED_SIGNATURES}${newStatus === "COMPLETED" ? " — транзакция завершена" : ""}`
            : `Отклонение${newStatus === "REJECTED" ? " — транзакция отклонена" : ""}`,
        })
      },

      checkDeadlines: () => {
        const now = Date.now()
        const state = get()
        const expiredTxIds: string[] = []

        state.transactions.forEach((tx) => {
          if (tx.status === "WAITING_MPC" || tx.status === "MPC_SIGNING") {
            const session = state.mpcSessions.find((s) => s.id === tx.mpcSessionId)
            if (session && new Date(session.deadline).getTime() <= now) {
              expiredTxIds.push(tx.id)
            }
          }
        })

        if (expiredTxIds.length > 0) {
          set((state) => ({
            transactions: state.transactions.map((t) =>
              expiredTxIds.includes(t.id)
                ? { ...t, status: "FAILED" as const, updatedAt: new Date().toISOString() }
                : t
            ),
          }))

          expiredTxIds.forEach((id) => {
            useAuditStore.getState().addLog({
              actor: "Система",
              action: "Таймаут транзакции",
              entityType: "transaction",
              entityId: id,
              details: "Дедлайн истёк — транзакция провалена",
            })
          })
        }
      },
    }),
    { name: "hashwallet-transactions" }
  )
)
