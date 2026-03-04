"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAddressStore } from "@/store"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { toast } from "sonner"
import type { AddressType } from "@/types"

interface CreateAddressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAddressDialog({
  open,
  onOpenChange,
}: CreateAddressDialogProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<AddressType>("MAIN")
  const [showConfirm, setShowConfirm] = useState(false)
  const createAddress = useAddressStore((s) => s.createAddress)

  const canSubmit = name.trim().length > 0

  const handleCreate = () => {
    createAddress(name.trim(), type)
    toast.success("Адрес успешно создан")
    setName("")
    setType("MAIN")
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новый адрес</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Имя адреса</Label>
              <Input
                id="name"
                placeholder="Например: Основной кошелёк"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Тип</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as AddressType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAIN">MAIN</SelectItem>
                  <SelectItem value="TRANSIT">TRANSIT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Сеть</Label>
              <Input value="BITCOIN" disabled />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button disabled={!canSubmit} onClick={() => setShowConfirm(true)}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Создать адрес?"
        description={`Будет создан новый адрес "${name}" типа ${type}.`}
        confirmLabel="Создать"
        onConfirm={handleCreate}
      />
    </>
  )
}
