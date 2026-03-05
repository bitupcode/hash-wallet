"use client"

import { SignerQueue } from "@/components/signer/signer-queue"

export default function SignerTransactionsPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Очередь подписания</h2>
      <SignerQueue />
    </div>
  )
}
