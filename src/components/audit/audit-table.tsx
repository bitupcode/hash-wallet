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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { useAuditStore } from "@/store"
import { Search, FileText } from "lucide-react"

const PAGE_SIZE = 20

export function AuditTable() {
  const logs = useAuditStore((s) => s.logs)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    if (!search) return logs
    const q = search.toLowerCase()
    return logs.filter(
      (log) =>
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.entityType.toLowerCase().includes(q) ||
        log.entityId.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
    )
  }, [logs, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Журнал пуст"
        description="Записи аудита будут появляться по мере выполнения действий."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Поиск..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="pl-9"
        />
      </div>

      <div className="bg-white rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Время</TableHead>
              <TableHead>Актор</TableHead>
              <TableHead>Действие</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Детали</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString("ru-RU")}
                </TableCell>
                <TableCell className="font-medium">{log.actor}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell className="text-muted-foreground">
                  {log.entityType}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {log.entityId.slice(0, 10)}...
                </TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {log.details}
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
    </div>
  )
}
