"use client"

import { Badge } from "@/components/ui/badge"
import type { TransactionStatus } from "@/types"
import { STATUS_LABELS } from "@/types"

const statusStyles: Record<TransactionStatus, string> = {
  DRAFT: "bg-gray-50 text-gray-600 border-gray-300",
  WAITING_MPC: "bg-amber-50 text-amber-600 border-amber-300",
  MPC_SIGNING: "bg-blue-50 text-blue-600 border-blue-300",
  COMPLETED: "bg-green-50 text-green-600 border-green-300",
  REJECTED: "bg-red-50 text-red-500 border-red-300",
  FAILED: "bg-red-50 text-red-700 border-red-400",
}

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <Badge variant="outline" className={`${statusStyles[status]} uppercase text-[10px] font-semibold tracking-wide`}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
