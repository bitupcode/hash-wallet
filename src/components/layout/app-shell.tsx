"use client"

import { useEffect } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { DebugPanel } from "./debug-panel"
import { useInitializeStores, useTransactionStore } from "@/store"

export function AppShell({ children }: { children: React.ReactNode }) {
  useInitializeStores()

  const checkDeadlines = useTransactionStore((s) => s.checkDeadlines)

  useEffect(() => {
    const interval = setInterval(checkDeadlines, 10000)
    return () => clearInterval(interval)
  }, [checkDeadlines])

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-col h-full">
        <Sidebar />
        <DebugPanel />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 bg-background">{children}</main>
      </div>
    </div>
  )
}
