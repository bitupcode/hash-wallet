"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { AddressSearch } from "./address-search"
import { CreateAddressDialog } from "./create-address-dialog"
import { EmptyState } from "@/components/common/empty-state"
import { CopyButton } from "@/components/common/copy-button"
import { useAddressStore } from "@/store"
import { Plus, Wallet, ArrowUpDown } from "lucide-react"

type SortField = "name" | "createdAt"
type SortDir = "asc" | "desc"

const PAGE_SIZE = 10

export function AddressTable() {
  const router = useRouter()
  const addresses = useAddressStore((s) => s.addresses)
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(0)
  const [showCreate, setShowCreate] = useState(false)

  const handleSearch = useCallback((q: string) => {
    setSearch(q)
    setPage(0)
  }, [])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const filtered = useMemo(() => {
    let items = addresses
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.address.toLowerCase().includes(q)
      )
    }
    items = [...items].sort((a, b) => {
      let cmp = 0
      if (sortField === "name") cmp = a.name.localeCompare(b.name)
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortDir === "asc" ? cmp : -cmp
    })
    return items
  }, [addresses, search, sortField, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  if (addresses.length === 0) {
    return (
      <>
        <EmptyState
          icon={Wallet}
          title="Нет адресов"
          description="Создайте первый Bitcoin-адрес для начала работы."
          actionLabel="Создать адрес"
          onAction={() => setShowCreate(true)}
        />
        <CreateAddressDialog open={showCreate} onOpenChange={setShowCreate} />
      </>
    )
  }

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField
    children: React.ReactNode
  }) => (
    <TableHead
      className="cursor-pointer select-none"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className="size-3" />
      </span>
    </TableHead>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <AddressSearch onSearch={handleSearch} />
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="size-4 mr-1" />
          Создать адрес
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Адрес</TableHead>
              <SortHeader field="name">Имя адреса</SortHeader>
              <TableHead>Сеть</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((addr) => (
              <TableRow
                key={addr.id}
                className="cursor-pointer"
                onClick={() => router.push(`/addresses/${addr.id}`)}
              >
                <TableCell className="pl-4">
                  <span className="inline-flex items-center gap-1 font-mono text-sm">
                    <span className="break-all">{addr.address}</span>
                    <CopyButton text={addr.address} />
                  </span>
                </TableCell>
                <TableCell className="font-medium">{addr.name}</TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  Bitcoin (BTC)
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

      <CreateAddressDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  )
}
