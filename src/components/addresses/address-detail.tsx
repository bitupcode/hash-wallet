"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BtcAddress } from "@/components/common/btc-address"
import { AddressTransactions } from "./address-transactions"
import { TransferWizard } from "./transfer-wizard"
import { useAddressStore } from "@/store"
import { formatBtc } from "@/lib/utils"
import { NETWORK_FEE } from "@/types"
import type { Address } from "@/types"
import { ArrowLeft, Send, Plus } from "lucide-react"
import { toast } from "sonner"

interface AddressDetailProps {
  address: Address
}

export function AddressDetail({ address }: AddressDetailProps) {
  const [showTransfer, setShowTransfer] = useState(false)
  const addBalance = useAddressStore((s) => s.addBalance)
  // Re-read for reactivity
  const current = useAddressStore((s) =>
    s.addresses.find((a) => a.id === address.id)
  ) ?? address

  const canTransfer = current.balance >= NETWORK_FEE

  const handleDebugAdd = () => {
    addBalance(current.id, 1)
    toast.success("Баланс пополнен на 1 BTC")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/addresses" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="size-4" />
          Адреса
        </Link>
        <span>/</span>
        <span className="text-foreground">{current.name}</span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{current.name}</CardTitle>
            <Badge variant="outline">{current.type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Адрес</div>
            <BtcAddress address={current.address} full />
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Баланс</div>
            <div className="text-3xl font-bold">
              {formatBtc(current.balance)} <span className="text-lg text-muted-foreground">BTC</span>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="text-sm text-muted-foreground">
              Сеть: {current.network}
            </div>
            <span className="text-muted-foreground">|</span>
            <div className="text-sm text-muted-foreground">
              Создан: {new Date(current.createdAt).toLocaleDateString("ru-RU")}
            </div>
          </div>
          <Separator />
          <div className="flex gap-2">
            <Button
              disabled={!canTransfer}
              onClick={() => setShowTransfer(true)}
            >
              <Send className="size-4 mr-1" />
              Сделать перевод
            </Button>
            <Button
              variant="outline"
              className="debug-border"
              onClick={handleDebugAdd}
            >
              <Plus className="size-4 mr-1" />
              Debug: Add 1 BTC
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Последние транзакции</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressTransactions addressId={current.id} />
        </CardContent>
      </Card>

      <TransferWizard
        open={showTransfer}
        onOpenChange={setShowTransfer}
        sourceAddress={current}
      />
    </div>
  )
}
