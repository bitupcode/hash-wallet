"use client"

import { truncateAddress } from "@/lib/utils"
import { CopyButton } from "./copy-button"

interface BtcAddressProps {
  address: string
  full?: boolean
}

export function BtcAddress({ address, full }: BtcAddressProps) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-sm">
      <span>{full ? address : truncateAddress(address)}</span>
      <CopyButton text={address} />
    </span>
  )
}
