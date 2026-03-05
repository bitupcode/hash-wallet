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
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { BtcAddress } from "@/components/common/btc-address"
import { TransactionFilters } from "./transaction-filters"
import { TransactionDetailModal } from "./transaction-detail-modal"
import { EmptyState } from "@/components/common/empty-state"
import { useTransactionStore } from "@/store"
import { formatBtc } from "@/lib/utils"
import { TablePagination } from "@/components/common/table-pagination"
import { History, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react"
import type { Transaction, TransactionStatus, TransactionType } from "@/types"

const PAGE_SIZE = 10

function DirectionIcon({ tx }: { tx: Transaction }) {
  if (tx.type === "INTERNAL")
    return <ArrowLeftRight className="size-4 text-blue-500" />
  if (tx.direction === "INBOUND")
    return <ArrowDownLeft className="size-4 text-green-600" />
  return <ArrowUpRight className="size-4 text-orange-500" />
}

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

      <div className="text-sm text-muted-foreground">
        Всего <span className="font-semibold text-foreground">{filtered.length}</span>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Дата и время</TableHead>
              <TableHead>Отправитель</TableHead>
              <TableHead>Получатель</TableHead>
              <TableHead>Сеть</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Сумма (BTC)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((tx) => {
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
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
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
                  <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                    Bitcoin (BTC)
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={tx.status} />
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatBtc(tx.amount)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

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
