export { useAuthStore } from "./auth-store"
export { useAddressStore } from "./address-store"
export { useTransactionStore } from "./transaction-store"
export { useAuditStore } from "./audit-store"

import { useEffect, useRef } from "react"
import { useAddressStore } from "./address-store"
import { useTransactionStore } from "./transaction-store"
import { useAuditStore } from "./audit-store"
import {
  SEED_ADDRESSES,
  SEED_TRANSACTIONS,
  SEED_MPC_SESSIONS,
  SEED_AUDIT_LOGS,
} from "@/lib/mock-data"

const SEED_KEY = "hashwallet-seeded"

export function useInitializeStores() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (typeof window !== "undefined" && !localStorage.getItem(SEED_KEY)) {
      useAddressStore.getState().setAddresses(SEED_ADDRESSES)
      useTransactionStore.getState().setTransactions(SEED_TRANSACTIONS)
      useTransactionStore.getState().setMpcSessions(SEED_MPC_SESSIONS)
      useAuditStore.getState().setLogs(SEED_AUDIT_LOGS)
      localStorage.setItem(SEED_KEY, "true")
    }
  }, [])
}
