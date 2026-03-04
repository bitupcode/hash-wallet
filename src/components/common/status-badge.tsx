"use client"

import { Badge } from "@/components/ui/badge"
import type { TransactionStatus } from "@/types"
import { STATUS_LABELS } from "@/types"

const statusStyles: Record<TransactionStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-300",
  WAITING_MPC: "bg-yellow-50 text-yellow-700 border-yellow-300",
  MPC_SIGNING: "bg-blue-50 text-blue-700 border-blue-300",
  COMPLETED: "bg-green-50 text-green-700 border-green-300",
  REJECTED: "bg-red-50 text-red-700 border-red-300",
  FAILED: "bg-red-100 text-red-900 border-red-400",
}

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
