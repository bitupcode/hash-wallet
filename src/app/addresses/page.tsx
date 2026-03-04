"use client"

import { AddressTable } from "@/components/addresses/address-table"

export default function AddressesPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Адреса</h2>
      <AddressTable />
    </div>
  )
}
