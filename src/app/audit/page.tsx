"use client"

import { AuditTable } from "@/components/audit/audit-table"

export default function AuditPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Журнал аудита</h2>
      <AuditTable />
    </div>
  )
}
