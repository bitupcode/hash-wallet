"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { useAddressStore, useTransactionStore } from "@/store"
import { formatBtc, mockDelay, generateKytScore } from "@/lib/utils"
import { NETWORK_FEE } from "@/types"
import type { Address } from "@/types"
import { toast } from "sonner"

interface TransferWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceAddress: Address
}

export function TransferWizard({
  open,
  onOpenChange,
  sourceAddress,
}: TransferWizardProps) {
  const [step, setStep] = useState(1)
  const [toAddress, setToAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [comment, setComment] = useState("")
  const [kytScore, setKytScore] = useState<number | null>(null)
  const [kytLoading, setKytLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const addresses = useAddressStore((s) => s.addresses)
  const createTransaction = useTransactionStore((s) => s.createTransaction)

  const otherAddresses = addresses.filter((a) => a.id !== sourceAddress.id)
  const maxAmount = Math.max(0, sourceAddress.balance - NETWORK_FEE)
  const amountNum = parseFloat(amount) || 0

  const errors: string[] = []
  if (amountNum <= 0 && amount.length > 0) errors.push("Сумма должна быть больше 0")
  if (amountNum + NETWORK_FEE > sourceAddress.balance)
    errors.push("Недостаточно средств (сумма + комиссия)")
  if (toAddress === sourceAddress.address)
    errors.push("Нельзя отправить на тот же адрес")

  const canProceed =
    toAddress.trim().length > 0 &&
    amountNum > 0 &&
    amountNum + NETWORK_FEE <= sourceAddress.balance &&
    toAddress !== sourceAddress.address

  const isInternal = addresses.some((a) => a.address === toAddress)

  const reset = () => {
    setStep(1)
    setToAddress("")
    setAmount("")
    setComment("")
    setKytScore(null)
    setKytLoading(false)
    setSubmitting(false)
  }

  const handleClose = (v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }

  // Step 2: KYT check
  useEffect(() => {
    if (step === 2 && !kytLoading && kytScore === null) {
      setKytLoading(true)
      mockDelay(2000).then(() => {
        const score = generateKytScore()
        setKytScore(score)
        setKytLoading(false)
      })
    }
  }, [step, kytLoading, kytScore])

  const handleSubmit = async () => {
    setSubmitting(true)
    await mockDelay(1500)
    const tx = createTransaction({
      fromAddressId: sourceAddress.id,
      fromAddress: sourceAddress.address,
      toAddress,
      amount: amountNum,
      comment,
      kytScore: kytScore ?? 0,
    })
    setSubmitting(false)
    if (tx) {
      toast.success("Транзакция создана и ожидает подписания")
      handleClose(false)
    } else {
      toast.error("Ошибка создания транзакции")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Перевод средств — Шаг {step}/3
            </DialogTitle>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4 py-2">
              <div className="text-sm text-muted-foreground">
                Отправитель:{" "}
                <span className="font-mono font-medium text-foreground">
                  {sourceAddress.name}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Доступный баланс:{" "}
                <span className="font-mono font-medium text-foreground">
                  {formatBtc(sourceAddress.balance)} BTC
                </span>
              </div>
              <Separator />

              <div className="space-y-2">
                <Label>Адрес получателя</Label>
                <div className="relative">
                  <Input
                    placeholder="Bitcoin-адрес..."
                    value={toAddress}
                    onChange={(e) => {
                      setToAddress(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  />
                  {showDropdown && toAddress.length === 0 && otherAddresses.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-background shadow-md z-50 max-h-40 overflow-auto">
                      {otherAddresses.map((a) => (
                        <button
                          key={a.id}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                          onMouseDown={() => {
                            setToAddress(a.address)
                            setShowDropdown(false)
                          }}
                        >
                          <div className="font-medium">{a.name}</div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {a.address}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Сумма (BTC)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.00000001"
                    min="0"
                    placeholder="0.00000000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(maxAmount.toFixed(8))}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Комментарий</Label>
                <Textarea
                  placeholder="Причина перевода..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                Комиссия сети: <span className="font-mono">{formatBtc(NETWORK_FEE)} BTC</span>
              </div>

              {errors.length > 0 && (
                <div className="text-sm text-destructive space-y-1">
                  {errors.map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="py-8 flex flex-col items-center gap-4">
              {kytLoading ? (
                <>
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Проверка BitOk KYT...
                  </p>
                </>
              ) : kytScore !== null ? (
                <>
                  <div className="text-center space-y-2">
                    <div className="text-sm text-muted-foreground">
                      KYT Risk Score
                    </div>
                    <div
                      className={`text-3xl font-bold ${
                        kytScore <= 20 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {kytScore}%
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        kytScore <= 20
                          ? "bg-green-50 text-green-700 border-green-300"
                          : "bg-red-50 text-red-700 border-red-300"
                      }
                    >
                      {kytScore <= 20 ? "Низкий риск" : "Повышенный риск"}
                    </Badge>
                    {kytScore > 20 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Высокий KYT score. Перевод не заблокирован, но
                        рекомендуется проверить получателя.
                      </p>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Отправитель</span>
                <span className="font-mono">{sourceAddress.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Получатель</span>
                <span className="font-mono text-xs">
                  {toAddress.slice(0, 16)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Тип</span>
                <Badge variant="outline">
                  {isInternal ? "INTERNAL" : "EXTERNAL"}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Сумма</span>
                <span className="font-mono">{formatBtc(amountNum)} BTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Комиссия</span>
                <span className="font-mono">{formatBtc(NETWORK_FEE)} BTC</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Итого</span>
                <span className="font-mono">
                  {formatBtc(amountNum + NETWORK_FEE)} BTC
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">KYT Score</span>
                <span
                  className={
                    (kytScore ?? 0) <= 20 ? "text-green-600" : "text-red-600"
                  }
                >
                  {kytScore}%
                </span>
              </div>
              {comment && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Комментарий</span>
                  <span className="max-w-[200px] text-right">{comment}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={submitting}
              >
                Назад
              </Button>
            )}
            {step === 1 && (
              <Button disabled={!canProceed} onClick={() => setStep(2)}>
                Далее
              </Button>
            )}
            {step === 2 && (
              <Button
                disabled={kytLoading}
                onClick={() => setStep(3)}
              >
                Далее
              </Button>
            )}
            {step === 3 && (
              <Button
                disabled={submitting}
                onClick={() => setShowConfirm(true)}
              >
                {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
                Подтвердить перевод
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Подтвердить перевод?"
        description={`Перевод ${formatBtc(amountNum)} BTC будет отправлен на подписание.`}
        confirmLabel="Подтвердить"
        onConfirm={handleSubmit}
      />
    </>
  )
}
