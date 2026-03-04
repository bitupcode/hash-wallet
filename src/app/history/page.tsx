"use client"

import { TransactionTable } from "@/components/transactions/transaction-table"

export default function HistoryPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">История операций</h2>
      <TransactionTable />
    </div>
  )
}
