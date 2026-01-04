"use client"

import { useEffect, useState } from "react"
import { calculateDeadlineRemaining } from "@/lib/utils/compliance"
import { cn } from "@/lib/utils"

interface DeadlineBadgeProps {
  deadline: Date
  status?: string
}

export function DeadlineBadge({ deadline, status }: DeadlineBadgeProps) {
  const [remaining, setRemaining] = useState(calculateDeadlineRemaining(deadline))

  const isResolved = status === "resolved"

  useEffect(() => {
    if (isResolved) return

    const interval = setInterval(() => {
      setRemaining(calculateDeadlineRemaining(deadline))
    }, 1000)

    return () => clearInterval(interval)
  }, [deadline, isResolved])

  const label = isResolved
    ? "Met"
    : remaining.isOverdue
      ? "Not Met"
      : `${String(remaining.hours).padStart(2, "0")}:${String(remaining.minutes).padStart(2, "0")}:${String(
          remaining.seconds,
        ).padStart(2, "0")}`

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tabular-nums",
        isResolved
          ? "bg-green-500/10 text-green-600"
          : remaining.isOverdue
            ? "bg-red-500/10 text-red-600"
            : remaining.isCritical
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  )
}
