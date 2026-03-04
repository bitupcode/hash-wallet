"use client"

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
import { useTransactionStore } from "@/store"
import { formatBtc } from "@/lib/utils"

interface AddressTransactionsProps {
  addressId: string
}

export function AddressTransactions({ addressId }: AddressTransactionsProps) {
  const transactions = useTransactionStore((s) => s.transactions)

  const related = transactions
    .filter(
      (tx) =>
        tx.fromAddressId === addressId
    )
    .slice(0, 5)

  if (related.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Нет транзакций для этого адреса.
      </p>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Кому</TableHead>
            <TableHead>Сумма</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Дата</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {related.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell>
                <BtcAddress address={tx.toAddress} />
              </TableCell>
              <TableCell className="font-mono">{formatBtc(tx.amount)}</TableCell>
              <TableCell>
                <StatusBadge status={tx.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(tx.createdAt).toLocaleDateString("ru-RU")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
