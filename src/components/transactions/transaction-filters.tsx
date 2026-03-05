"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TransactionStatus, TransactionType } from "@/types"

interface TransactionFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  status: TransactionStatus | "ALL"
  onStatusChange: (v: TransactionStatus | "ALL") => void
  type: TransactionType | "ALL"
  onTypeChange: (v: TransactionType | "ALL") => void
  dateFrom: string
  onDateFromChange: (v: string) => void
  dateTo: string
  onDateToChange: (v: string) => void
}

export function TransactionFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  type,
  onTypeChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Поиск..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={status}
        onValueChange={(v) => onStatusChange(v as TransactionStatus | "ALL")}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Статус" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Все статусы</SelectItem>
          <SelectItem value="DRAFT">Черновик</SelectItem>
          <SelectItem value="WAITING_MPC">Ожидание подписей</SelectItem>
          <SelectItem value="MPC_SIGNING">Подписание</SelectItem>
          <SelectItem value="COMPLETED">Исполнена</SelectItem>
          <SelectItem value="REJECTED">Отклонена</SelectItem>
          <SelectItem value="FAILED">Ошибка</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={type}
        onValueChange={(v) => onTypeChange(v as TransactionType | "ALL")}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Тип" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Все типы</SelectItem>
          <SelectItem value="INTERNAL">Внутренний</SelectItem>
          <SelectItem value="EXTERNAL">Внешний</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="w-36"
        />
        <span className="text-muted-foreground text-sm">—</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="w-36"
        />
      </div>
    </div>
  )
}
