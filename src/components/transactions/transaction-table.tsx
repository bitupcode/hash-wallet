"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { BtcAddress } from "@/components/common/btc-address"
import { TransactionFilters } from "./transaction-filters"
import { TransactionDetailModal } from "./transaction-detail-modal"
import { EmptyState } from "@/components/common/empty-state"
import { useTransactionStore } from "@/store"
import { formatBtc } from "@/lib/utils"
import { History } from "lucide-react"
import type { Transaction, TransactionStatus, TransactionType } from "@/types"

const PAGE_SIZE = 10

export function TransactionTable() {
  const transactions = useTransactionStore((s) => s.transactions)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "ALL">("ALL")
  const [typeFilter, setTypeFilter] = useState<TransactionType | "ALL">("ALL")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(0)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  const filtered = useMemo(() => {
    let items = transactions
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(
        (tx) =>
          tx.id.toLowerCase().includes(q) ||
          (tx.txHash && tx.txHash.toLowerCase().includes(q)) ||
          tx.fromAddress.toLowerCase().includes(q) ||
          tx.toAddress.toLowerCase().includes(q) ||
          tx.comment.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== "ALL") {
      items = items.filter((tx) => tx.status === statusFilter)
    }
    if (typeFilter !== "ALL") {
      items = items.filter((tx) => tx.type === typeFilter)
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime()
      items = items.filter((tx) => new Date(tx.createdAt).getTime() >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000
      items = items.filter((tx) => new Date(tx.createdAt).getTime() <= to)
    }
    return [...items].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [transactions, search, statusFilter, typeFilter, dateFrom, dateTo])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Нет транзакций"
        description="Транзакции появятся после первого перевода."
      />
    )
  }

  return (
    <div className="space-y-4">
      <TransactionFilters
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(0) }}
        status={statusFilter}
        onStatusChange={(v) => { setStatusFilter(v); setPage(0) }}
        type={typeFilter}
        onTypeChange={(v) => { setTypeFilter(v); setPage(0) }}
        dateFrom={dateFrom}
        onDateFromChange={(v) => { setDateFrom(v); setPage(0) }}
        dateTo={dateTo}
        onDateToChange={(v) => { setDateTo(v); setPage(0) }}
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Отправитель</TableHead>
              <TableHead>Получатель</TableHead>
              <TableHead>Сумма (BTC)</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((tx) => (
              <TableRow
                key={tx.id}
                className="cursor-pointer"
                onClick={() => setSelectedTx(tx)}
              >
                <TableCell className="font-mono text-xs">
                  {tx.id.slice(0, 8)}...
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{tx.type}</Badge>
                </TableCell>
                <TableCell>
                  <BtcAddress address={tx.fromAddress} />
                </TableCell>
                <TableCell>
                  <BtcAddress address={tx.toAddress} />
                </TableCell>
                <TableCell className="font-mono">
                  {formatBtc(tx.amount)}
                </TableCell>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Вперёд
          </Button>
        </div>
      )}

      <TransactionDetailModal
        transaction={selectedTx}
        open={!!selectedTx}
        onOpenChange={(open) => {
          if (!open) setSelectedTx(null)
        }}
      />
    </div>
  )
}
