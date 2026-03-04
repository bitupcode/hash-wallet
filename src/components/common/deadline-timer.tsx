"use client"

import { useEffect, useState } from "react"

interface DeadlineTimerProps {
  deadline: string
}

export function DeadlineTimer({ deadline }: DeadlineTimerProps) {
  const [remaining, setRemaining] = useState("")
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining("00:00")
        setIsUrgent(true)
        return
      }
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setRemaining(
        `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      )
      setIsUrgent(diff < 60000)
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  return (
    <span
      className={`font-mono text-sm font-semibold ${
        isUrgent ? "text-red-600" : "text-muted-foreground"
      }`}
    >
      {remaining}
    </span>
  )
}
