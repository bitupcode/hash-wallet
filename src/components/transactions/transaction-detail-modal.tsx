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
import { useTransactionStore, useAuthStore, useAddressStore } from "@/store"
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

function getTypeLabel(tx: Transaction): string {
  if (tx.type === "INTERNAL") return "Внутренний"
  return "Внешний"
}

function getDirectionLabel(tx: Transaction): string | null {
  if (tx.type !== "EXTERNAL") return null
  return tx.direction === "INBOUND" ? "Входящий" : "Исходящий"
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
  const addresses = useAddressStore((s) => s.addresses)

  if (!transaction) return null

  const session = mpcSessions.find((s) => s.id === transaction.mpcSessionId)

  const fromAddrObj = addresses.find((a) => a.address === transaction.fromAddress)
  const toAddrObj = addresses.find((a) => a.address === transaction.toAddress)

  const isInbound = transaction.direction === "INBOUND"

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

  const allFromAddresses = transaction.fromAddresses && transaction.fromAddresses.length > 1
    ? transaction.fromAddresses
    : null

  const directionLabel = getDirectionLabel(transaction)

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
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Тип</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{getTypeLabel(transaction)}</Badge>
                {directionLabel && (
                  <Badge
                    variant="outline"
                    className={
                      isInbound
                        ? "bg-green-50 text-green-700 border-green-300"
                        : "bg-orange-50 text-orange-700 border-orange-300"
                    }
                  >
                    {directionLabel}
                  </Badge>
                )}
              </div>
            </div>

            {/* Отправитель */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Отправитель</span>
                {fromAddrObj && (
                  <span className="text-sm">{fromAddrObj.name}</span>
                )}
              </div>
              <div className="text-right">
                <BtcAddress address={transaction.fromAddress} full />
              </div>
            </div>

            {/* Все адреса отправителей для INBOUND */}
            {allFromAddresses && (
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">
                  Все адреса отправителей ({allFromAddresses.length}):
                </span>
                <div className="space-y-1 pl-2 border-l-2 border-muted">
                  {allFromAddresses.map((addr, i) => (
                    <div key={i}>
                      <BtcAddress address={addr} full />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Получатель */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Получатель</span>
                {toAddrObj && (
                  <span className="text-sm">{toAddrObj.name}</span>
                )}
              </div>
              <div className="text-right">
                <BtcAddress address={transaction.toAddress} full />
              </div>
            </div>

            <Separator />

            <div className="flex justify-between">
              <span className="text-muted-foreground">Сумма к получению</span>
              <span className="font-medium">{formatBtc(transaction.amount)} BTC</span>
            </div>

            {!isInbound && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Комиссия сети</span>
                  <span className="font-medium">{formatBtc(transaction.fee)} BTC</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Сумма списания</span>
                  <span className="font-medium">
                    {formatBtc(transaction.amount + transaction.fee)} BTC
                  </span>
                </div>
              </>
            )}

            <Separator />

            {/* TX Hash — только для COMPLETED */}
            {transaction.status === "COMPLETED" && transaction.txHash && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">TX Hash</span>
                <span className="flex items-center gap-1">
                  <span className="font-mono text-xs">
                    {transaction.txHash.slice(0, 12)}...
                  </span>
                  <CopyButton text={transaction.txHash} />
                  <a
                    href={`https://btcscan.org/tx/${transaction.txHash}`}
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

            {/* Инициатор */}
            {transaction.initiatorName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Инициатор</span>
                <span>{transaction.initiatorName}</span>
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

            {transaction.comment && !isInbound && (
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
