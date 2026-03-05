"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/common/status-badge"
import { BtcAddress } from "@/components/common/btc-address"
import { TransactionDetailModal } from "@/components/transactions/transaction-detail-modal"
import { useTransactionStore, useAddressStore } from "@/store"
import { formatBtc } from "@/lib/utils"
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react"
import type { Transaction } from "@/types"

interface AddressTransactionsProps {
  addressId: string
}

function DirectionIcon({ tx }: { tx: Transaction }) {
  if (tx.type === "INTERNAL")
    return <ArrowLeftRight className="size-4 text-blue-500" />
  if (tx.direction === "INBOUND")
    return <ArrowDownLeft className="size-4 text-green-600" />
  return <ArrowUpRight className="size-4 text-orange-500" />
}

export function AddressTransactions({ addressId }: AddressTransactionsProps) {
  const transactions = useTransactionStore((s) => s.transactions)
  const addresses = useAddressStore((s) => s.addresses)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  const currentAddress = addresses.find((a) => a.id === addressId)

  const related = transactions
    .filter(
      (tx) =>
        tx.fromAddressId === addressId ||
        (currentAddress && tx.toAddress === currentAddress.address)
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10)

  if (related.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Нет транзакций для этого адреса.
      </p>
    )
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Дата и время</TableHead>
              <TableHead>Отправитель</TableHead>
              <TableHead>Получатель</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Сумма</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {related.map((tx) => {
              const senderCount =
                tx.fromAddresses && tx.fromAddresses.length > 1
                  ? tx.fromAddresses.length - 1
                  : 0
              return (
                <TableRow
                  key={tx.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedTx(tx)}
                >
                  <TableCell>
                    <DirectionIcon tx={tx} />
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                    {new Date(tx.createdAt).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1">
                      <BtcAddress address={tx.fromAddress} />
                      {senderCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          (+{senderCount})
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <BtcAddress address={tx.toAddress} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={tx.status} />
                  </TableCell>
                  <TableCell className="font-mono">{formatBtc(tx.amount)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <TransactionDetailModal
        transaction={selectedTx}
        open={!!selectedTx}
        onOpenChange={(open) => {
          if (!open) setSelectedTx(null)
        }}
      />
    </>
  )
}
