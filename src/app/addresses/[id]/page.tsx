"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import { useAddressStore } from "@/store"
import { AddressDetail } from "@/components/addresses/address-detail"

export default function AddressDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const address = useAddressStore((s) => s.addresses.find((a) => a.id === id))

  if (!address) {
    notFound()
  }

  return <AddressDetail address={address} />
}
