"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/common/status-badge"
import { BtcAddress } from "@/components/common/btc-address"
import { DeadlineTimer } from "@/components/common/deadline-timer"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { useTransactionStore, useAuthStore } from "@/store"
import { formatBtc } from "@/lib/utils"
import { SIGNER_NAMES, REQUIRED_SIGNATURES } from "@/types"
import type { Transaction, SignerRole } from "@/types"
import { toast } from "sonner"
import { Check, X } from "lucide-react"

interface SignerTransactionDetailProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignerTransactionDetail({
  transaction,
  open,
  onOpenChange,
}: SignerTransactionDetailProps) {
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const signTransaction = useTransactionStore((s) => s.signTransaction)
  const mpcSessions = useTransactionStore((s) => s.mpcSessions)
  const currentRole = useAuthStore((s) => s.currentRole)

  if (!transaction) return null

  const session = mpcSessions.find((s) => s.id === transaction.mpcSessionId)
  if (!session) return null

  // Map operator role to signer role (signer1 stays signer1, signer2 stays signer2)
  const currentSigner = currentRole as SignerRole
  const hasVoted =
    session.signersApproved.includes(currentSigner) ||
    session.signersRejected.includes(currentSigner)

  const canVote =
    !hasVoted &&
    (transaction.status === "WAITING_MPC" || transaction.status === "MPC_SIGNING") &&
    currentRole !== "operator"

  const handleApprove = () => {
    signTransaction(transaction.id, currentSigner, true)
    toast.success("Вы подтвердили транзакцию")
    onOpenChange(false)
  }

  const handleReject = () => {
    signTransaction(transaction.id, currentSigner, false)
    toast.success("Вы отклонили транзакцию")
    onOpenChange(false)
  }

  const approvedCount = session.signersApproved.length

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Подписание
              <StatusBadge status={transaction.status} />
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Отправитель</span>
              <BtcAddress address={transaction.fromAddress} full />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Получатель</span>
              <BtcAddress address={transaction.toAddress} full />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Тип</span>
              <Badge variant="outline">{transaction.type}</Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Сумма</span>
              <span className="font-medium">{formatBtc(transaction.amount)} BTC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Комиссия</span>
              <span className="font-medium">{formatBtc(transaction.fee)} BTC</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Итого</span>
              <span className="font-medium">
                {formatBtc(transaction.amount + transaction.fee)} BTC
              </span>
            </div>

            {transaction.comment && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Комментарий</span>
                <span className="max-w-[250px] text-right">{transaction.comment}</span>
              </div>
            )}

            <Separator />

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  Подписи: {approvedCount}/{REQUIRED_SIGNATURES}
                </span>
                <DeadlineTimer deadline={session.deadline} />
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${(approvedCount / REQUIRED_SIGNATURES) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Signer statuses */}
            <div className="space-y-1">
              {(["signer1", "signer2", "signer3"] as const).map((s) => {
                const approved = session.signersApproved.includes(s)
                const rejected = session.signersRejected.includes(s)
                const isMe = s === currentSigner
                return (
                  <div
                    key={s}
                    className={`flex justify-between text-sm px-2 py-1 rounded ${
                      isMe ? "bg-accent" : ""
                    }`}
                  >
                    <span>
                      {SIGNER_NAMES[s]} {isMe && "(вы)"}
                    </span>
                    <span>
                      {approved && (
                        <span className="text-green-600 flex items-center gap-1">
                          <Check className="size-3" /> Подтвердил
                        </span>
                      )}
                      {rejected && (
                        <span className="text-red-600 flex items-center gap-1">
                          <X className="size-3" /> Отклонил
                        </span>
                      )}
                      {!approved && !rejected && (
                        <span className="text-muted-foreground">Ожидание</span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {canVote && (
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setShowApproveConfirm(true)}
              >
                <Check className="size-4 mr-1" />
                Подтвердить
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setShowRejectConfirm(true)}
              >
                <X className="size-4 mr-1" />
                Отклонить
              </Button>
            </div>
          )}

          {hasVoted && (
            <div className="text-sm text-muted-foreground text-center py-2">
              Вы уже проголосовали по этой транзакции.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showApproveConfirm}
        onOpenChange={setShowApproveConfirm}
        title="Подтвердить транзакцию?"
        description={`Вы подтверждаете перевод ${formatBtc(transaction.amount)} BTC.`}
        confirmLabel="Подтвердить"
        onConfirm={handleApprove}
      />

      <ConfirmDialog
        open={showRejectConfirm}
        onOpenChange={setShowRejectConfirm}
        title="Отклонить транзакцию?"
        description="Вы отклоняете эту транзакцию. Это действие нельзя отменить."
        confirmLabel="Отклонить"
        variant="destructive"
        onConfirm={handleReject}
      />
    </>
  )
}
