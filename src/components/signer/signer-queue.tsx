"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/common/status-badge"
import { BtcAddress } from "@/components/common/btc-address"
import { DeadlineTimer } from "@/components/common/deadline-timer"
import { EmptyState } from "@/components/common/empty-state"
import { SignerTransactionDetail } from "./signer-transaction-detail"
import { useTransactionStore, useAuthStore } from "@/store"
import { formatBtc } from "@/lib/utils"
import { PenTool, Check, X } from "lucide-react"
import type { Transaction, SignerRole } from "@/types"

export function SignerQueue() {
  const transactions = useTransactionStore((s) => s.transactions)
  const mpcSessions = useTransactionStore((s) => s.mpcSessions)
  const currentRole = useAuthStore((s) => s.currentRole)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  const pendingTxs = transactions.filter(
    (tx) => tx.status === "WAITING_MPC" || tx.status === "MPC_SIGNING"
  )

  const currentSigner = currentRole as SignerRole

  if (pendingTxs.length === 0) {
    return (
      <EmptyState
        icon={PenTool}
        title="Нет транзакций для подписания"
        description="Все транзакции подписаны или нет ожидающих."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Отправитель</TableHead>
              <TableHead>Получатель</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Сумма (BTC)</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Ваш голос</TableHead>
              <TableHead>Дедлайн</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingTxs.map((tx) => {
              const session = mpcSessions.find(
                (s) => s.id === tx.mpcSessionId
              )
              const approved = session?.signersApproved.includes(currentSigner)
              const rejected = session?.signersRejected.includes(currentSigner)

              return (
                <TableRow
                  key={tx.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedTx(tx)}
                >
                  <TableCell>
                    <BtcAddress address={tx.fromAddress} />
                  </TableCell>
                  <TableCell>
                    <BtcAddress address={tx.toAddress} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tx.type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatBtc(tx.amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={tx.status} />
                  </TableCell>
                  <TableCell>
                    {approved && (
                      <span className="text-green-600 flex items-center gap-1">
                        <Check className="size-3" /> Да
                      </span>
                    )}
                    {rejected && (
                      <span className="text-red-600 flex items-center gap-1">
                        <X className="size-3" /> Нет
                      </span>
                    )}
                    {!approved && !rejected && (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {session && <DeadlineTimer deadline={session.deadline} />}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <SignerTransactionDetail
        transaction={selectedTx}
        open={!!selectedTx}
        onOpenChange={(open) => {
          if (!open) setSelectedTx(null)
        }}
      />
    </div>
  )
}
