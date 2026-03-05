"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { CopyButton } from "@/components/common/copy-button"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { useAddressStore, useTransactionStore } from "@/store"
import { formatBtc, mockDelay } from "@/lib/utils"
import { NETWORK_FEE, DUST_RESERVE } from "@/types"
import type { Address } from "@/types"
import { toast } from "sonner"

interface TransferWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceAddress: Address
}

function isValidBtcAddress(address: string): boolean {
  if (/^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true
  if (/^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true
  if (/^bc1q[a-z0-9]{38,58}$/.test(address)) return true
  if (/^bc1p[a-z0-9]{38,58}$/.test(address)) return true
  return false
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
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const addresses = useAddressStore((s) => s.addresses)
  const createTransaction = useTransactionStore((s) => s.createTransaction)

  const otherAddresses = addresses.filter((a) => a.id !== sourceAddress.id)
  const maxAmount = Math.max(0, sourceAddress.balance - NETWORK_FEE - DUST_RESERVE)
  const amountNum = parseFloat(amount) || 0
  const totalDeduction = amountNum + NETWORK_FEE

  const matchedAddress = addresses.find((a) => a.address === toAddress)
  const isInternal = !!matchedAddress

  const errors: string[] = []
  if (amountNum <= 0 && amount.length > 0) errors.push("Сумма должна быть больше 0")
  if (amountNum > 0 && totalDeduction > sourceAddress.balance)
    errors.push("Недостаточно средств (сумма + комиссия > баланс)")
  if (toAddress === sourceAddress.address)
    errors.push("Нельзя отправить на тот же адрес")
  if (toAddress.trim().length > 0 && !isInternal && !isValidBtcAddress(toAddress))
    errors.push("Неверный формат адреса для сети Bitcoin")

  const addressValid =
    toAddress.trim().length > 0 &&
    toAddress !== sourceAddress.address &&
    (isInternal || isValidBtcAddress(toAddress))

  const canProceed =
    addressValid &&
    amountNum > 0 &&
    totalDeduction <= sourceAddress.balance

  const reset = () => {
    setStep(1)
    setToAddress("")
    setAmount("")
    setComment("")
    setSubmitting(false)
  }

  const handleClose = (v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    await mockDelay(1500)
    const tx = createTransaction({
      fromAddressId: sourceAddress.id,
      fromAddress: sourceAddress.address,
      toAddress,
      amount: amountNum,
      comment,
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
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>
              Перевод средств — Шаг {step}/2
            </SheetTitle>
            <SheetDescription className="sr-only">Мастер перевода средств</SheetDescription>
          </SheetHeader>

          {step === 1 && (
            <div className="space-y-4 pt-6 flex-1">
              <div className="text-sm text-muted-foreground">
                Отправитель:{" "}
                <span className="font-medium text-foreground">
                  {sourceAddress.name}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Доступный баланс:{" "}
                <span className="font-medium text-foreground">
                  {formatBtc(sourceAddress.balance)} BTC
                </span>
              </div>
              <Separator />

              {/* Адрес получателя */}
              <div className="space-y-2">
                <Label>Адрес получателя</Label>
                <div className="relative">
                  <Input
                    placeholder="Bitcoin-адрес (bc1q..., 1..., 3...)"
                    value={toAddress}
                    onChange={(e) => {
                      setToAddress(e.target.value)
                      setShowDropdown(true)
                    }}
                    onClick={() => setShowDropdown(true)}
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
                {matchedAddress && (
                  <p className="text-sm text-muted-foreground">
                    {matchedAddress.name}
                  </p>
                )}
                {toAddress.trim().length > 0 && !isInternal && !isValidBtcAddress(toAddress) && (
                  <p className="text-sm text-destructive">
                    Неверный формат адреса для сети Bitcoin
                  </p>
                )}
              </div>

              {/* Сумма к получению */}
              <div className="space-y-2">
                <Label>Сумма к получению (BTC)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    step="0.00000001"
                    min="0"
                    placeholder="0.00000000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Доступно: {formatBtc(sourceAddress.balance)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(maxAmount.toFixed(8))}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              {/* Комиссия сети (read-only) */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Комиссия сети</span>
                <span className="font-medium">{formatBtc(NETWORK_FEE)} BTC</span>
              </div>

              {/* Сумма списания (read-only) */}
              {amountNum > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Сумма списания</span>
                  <span
                    className={`font-semibold ${
                      totalDeduction > sourceAddress.balance ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {formatBtc(totalDeduction)} BTC
                  </span>
                </div>
              )}

              {/* Комментарий */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Комментарий</Label>
                  <span className="text-xs text-muted-foreground">
                    {comment.length}/255
                  </span>
                </div>
                <Textarea
                  placeholder="Причина перевода..."
                  value={comment}
                  maxLength={255}
                  onChange={(e) => setComment(e.target.value)}
                />
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
            <div className="space-y-4 pt-6 text-sm flex-1">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Отправитель</span>
                  <span className="font-medium">{sourceAddress.name}</span>
                </div>
                <div className="flex items-start justify-end gap-1">
                  <span className="font-mono text-sm text-foreground/70 break-all">
                    {sourceAddress.address}
                  </span>
                  <CopyButton text={sourceAddress.address} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Получатель</span>
                  {matchedAddress && (
                    <span className="font-medium">{matchedAddress.name}</span>
                  )}
                </div>
                <div className="flex items-start justify-end gap-1">
                  <span className="font-mono text-sm text-foreground/70 break-all">
                    {toAddress}
                  </span>
                  <CopyButton text={toAddress} />
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Тип</span>
                <Badge variant="outline">
                  {isInternal ? "Внутренний" : "Внешний"}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Сумма к получению</span>
                <span className="font-medium">{formatBtc(amountNum)} BTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Комиссия сети</span>
                <span className="font-medium">{formatBtc(NETWORK_FEE)} BTC</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Сумма списания</span>
                <span>
                  {formatBtc(totalDeduction)} BTC
                </span>
              </div>
              {comment && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Комментарий</span>
                    <p className="text-sm">{comment}</p>
                  </div>
                </>
              )}
            </div>
          )}

          <SheetFooter className="mt-auto pt-4">
            {step > 1 && (
              <Button
                variant="outline"
                size="lg"
                className="px-8"
                onClick={() => setStep(1)}
                disabled={submitting}
              >
                Назад
              </Button>
            )}
            {step === 1 && (
              <Button size="lg" className="px-8" disabled={!canProceed} onClick={() => setStep(2)}>
                Далее
              </Button>
            )}
            {step === 2 && (
              <Button
                size="lg"
                className="px-8"
                disabled={submitting}
                onClick={() => setShowConfirm(true)}
              >
                {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
                Подтвердить перевод
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Подтвердить перевод?"
        description={`Перевод ${formatBtc(amountNum)} BTC будет отправлен на подписание. Сумма списания: ${formatBtc(totalDeduction)} BTC.`}
        confirmLabel="Подтвердить"
        onConfirm={handleSubmit}
      />
    </>
  )
}
