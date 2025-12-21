"use client"

import { useEffect, useState } from "react"
import { calculateDeadlineRemaining } from "@/lib/utils/compliance"
import { cn } from "@/lib/utils"

interface DeadlineBadgeProps {
  deadline: Date
}

export function DeadlineBadge({ deadline }: DeadlineBadgeProps) {
  const [remaining, setRemaining] = useState(calculateDeadlineRemaining(deadline))

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(calculateDeadlineRemaining(deadline))
    }, 1000)

    return () => clearInterval(interval)
  }, [deadline])

  const label = remaining.isOverdue
    ? "OVERDUE"
    : `${String(remaining.hours).padStart(2, "0")}:${String(remaining.minutes).padStart(2, "0")}:${String(
        remaining.seconds,
      ).padStart(2, "0")}`

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tabular-nums",
        remaining.isOverdue
          ? "bg-destructive/10 text-destructive"
          : remaining.isCritical
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  )
}
