"use client"

import { Badge } from "@/components/ui/badge"
import type { TransactionStatus } from "@/types"
import { STATUS_LABELS } from "@/types"

const statusStyles: Record<TransactionStatus, string> = {
  DRAFT: "bg-transparent text-gray-600 border-gray-300",
  WAITING_MPC: "bg-transparent text-amber-600 border-amber-400",
  MPC_SIGNING: "bg-transparent text-blue-600 border-blue-400",
  COMPLETED: "bg-transparent text-green-600 border-green-400",
  REJECTED: "bg-transparent text-red-500 border-red-400",
  FAILED: "bg-transparent text-red-700 border-red-500",
}

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <Badge variant="outline" className={`${statusStyles[status]} uppercase text-[10px] font-semibold tracking-wide`}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
