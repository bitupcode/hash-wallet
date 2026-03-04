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
import { CopyButton } from "@/components/common/copy-button"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { useTransactionStore, useAuthStore } from "@/store"
import { formatBtc } from "@/lib/utils"
import { SIGNER_NAMES } from "@/types"
import type { Transaction } from "@/types"
import { toast } from "sonner"
import { ExternalLink, X } from "lucide-react"

interface TransactionDetailModalProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionDetailModal({
  transaction,
  open,
  onOpenChange,
}: TransactionDetailModalProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const cancelTransaction = useTransactionStore((s) => s.cancelTransaction)
  const mpcSessions = useTransactionStore((s) => s.mpcSessions)
  const currentRole = useAuthStore((s) => s.currentRole)

  if (!transaction) return null

  const session = mpcSessions.find((s) => s.id === transaction.mpcSessionId)

  const canCancel =
    currentRole === "operator" &&
    transaction.status === "WAITING_MPC" &&
    session &&
    session.signersApproved.length === 0 &&
    session.signersRejected.length === 0

  const handleCancel = () => {
    const success = cancelTransaction(transaction.id)
    if (success) {
      toast.success("Транзакция отменена")
      onOpenChange(false)
    } else {
      toast.error("Невозможно отменить транзакцию")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Транзакция
              <StatusBadge status={transaction.status} />
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono text-xs">{transaction.id.slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Тип</span>
              <Badge variant="outline">{transaction.type}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Отправитель</span>
              <BtcAddress address={transaction.fromAddress} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Получатель</span>
              <BtcAddress address={transaction.toAddress} />
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Сумма</span>
              <span className="font-mono">{formatBtc(transaction.amount)} BTC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Комиссия</span>
              <span className="font-mono">{formatBtc(transaction.fee)} BTC</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Итого</span>
              <span className="font-mono">
                {formatBtc(transaction.amount + transaction.fee)} BTC
              </span>
            </div>
            <Separator />

            {transaction.txHash && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">TX Hash</span>
                <span className="flex items-center gap-1">
                  <span className="font-mono text-xs">
                    {transaction.txHash.slice(0, 12)}...
                  </span>
                  <CopyButton text={transaction.txHash} />
                  <a
                    href={`https://www.blockchain.com/btc/tx/${transaction.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="size-3" />
                  </a>
                </span>
              </div>
            )}

            {transaction.kytScore !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">KYT Score</span>
                <span
                  className={
                    transaction.kytScore <= 20 ? "text-green-600" : "text-red-600"
                  }
                >
                  {transaction.kytScore}%
                </span>
              </div>
            )}

            {session && (
              <>
                <Separator />
                <div className="text-sm font-medium">MPC Session</div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Дедлайн</span>
                  <span>
                    {new Date(session.deadline).toLocaleString("ru-RU")}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">Голоса:</span>
                  {(["signer1", "signer2", "signer3"] as const).map((s) => {
                    const approved = session.signersApproved.includes(s)
                    const rejected = session.signersRejected.includes(s)
                    return (
                      <div key={s} className="flex justify-between text-xs">
                        <span>{SIGNER_NAMES[s]}</span>
                        <span>
                          {approved && "✅ Подтвердил"}
                          {rejected && "❌ Отклонил"}
                          {!approved && !rejected && "⏳ Ожидание"}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {transaction.comment && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Комментарий</span>
                  <span className="max-w-[250px] text-right">
                    {transaction.comment}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Создана: {new Date(transaction.createdAt).toLocaleString("ru-RU")}</span>
              <span>Обновлена: {new Date(transaction.updatedAt).toLocaleString("ru-RU")}</span>
            </div>
          </div>

          {canCancel && (
            <div className="pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowCancelConfirm(true)}
              >
                <X className="size-4 mr-1" />
                Отменить транзакцию
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title="Отменить транзакцию?"
        description="Транзакция будет отклонена. Это действие нельзя отменить."
        confirmLabel="Отменить транзакцию"
        variant="destructive"
        onConfirm={handleCancel}
      />
    </>
  )
}
