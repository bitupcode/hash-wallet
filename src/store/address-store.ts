import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Address, AddressType } from "@/types"
import { generateBtcAddress, generateId } from "@/lib/utils"
import { useAuditStore } from "./audit-store"

interface AddressStore {
  addresses: Address[]
  setAddresses: (addresses: Address[]) => void
  createAddress: (name: string, type: AddressType) => Address
  addBalance: (id: string, amount: number) => void
  deductBalance: (id: string, amount: number) => void
}

export const useAddressStore = create<AddressStore>()(
  persist(
    (set, get) => ({
      addresses: [],
      setAddresses: (addresses) => set({ addresses }),
      createAddress: (name, type) => {
        const newAddress: Address = {
          id: generateId(),
          address: generateBtcAddress(),
          name,
          type,
          network: "BITCOIN",
          balance: 0,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          addresses: [...state.addresses, newAddress],
        }))
        useAuditStore.getState().addLog({
          actor: "Оператор",
          action: "Создание адреса",
          entityType: "address",
          entityId: newAddress.id,
          details: `Создан адрес "${name}" (${type})`,
        })
        return newAddress
      },
      addBalance: (id, amount) => {
        set((state) => ({
          addresses: state.addresses.map((a) =>
            a.id === id ? { ...a, balance: a.balance + amount } : a
          ),
        }))
        const addr = get().addresses.find((a) => a.id === id)
        useAuditStore.getState().addLog({
          actor: "Debug",
          action: "Пополнение баланса",
          entityType: "address",
          entityId: id,
          details: `+${amount} BTC → ${addr?.name ?? id}`,
        })
      },
      deductBalance: (id, amount) => {
        set((state) => ({
          addresses: state.addresses.map((a) =>
            a.id === id ? { ...a, balance: a.balance - amount } : a
          ),
        }))
      },
    }),
    { name: "hashwallet-addresses" }
  )
)
