import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AuditLogEntry } from "@/types"
import { generateId } from "@/lib/utils"

interface AuditStore {
  logs: AuditLogEntry[]
  setLogs: (logs: AuditLogEntry[]) => void
  addLog: (entry: Omit<AuditLogEntry, "id" | "timestamp">) => void
}

export const useAuditStore = create<AuditStore>()(
  persist(
    (set) => ({
      logs: [],
      setLogs: (logs) => set({ logs }),
      addLog: (entry) =>
        set((state) => ({
          logs: [
            {
              ...entry,
              id: generateId(),
              timestamp: new Date().toISOString(),
            },
            ...state.logs,
          ],
        })),
    }),
    { name: "hashwallet-audit" }
  )
)
