"use client"

import { Button } from "@/components/ui/button"
import { useTransactionStore } from "@/store"
import { Bug, RefreshCw } from "lucide-react"

export function DebugPanel() {
  const checkDeadlines = useTransactionStore((s) => s.checkDeadlines)

  const handleReset = () => {
    localStorage.clear()
    window.location.reload()
  }

  return (
    <div className="debug-border rounded-md p-3 m-2 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-orange-600">
        <Bug className="size-3" />
        Debug
      </div>
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          className="debug-border text-xs"
          onClick={handleReset}
        >
          <RefreshCw className="size-3 mr-1" />
          Сбросить данные
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="debug-border text-xs"
          onClick={checkDeadlines}
        >
          Проверить дедлайны
        </Button>
      </div>
    </div>
  )
}
