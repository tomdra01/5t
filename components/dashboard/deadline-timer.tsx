"use client"

import { useEffect, useState } from "react"
import { Clock, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { calculateDeadlineRemaining } from "@/lib/utils/compliance"
import type { Vulnerability } from "@/types"

interface DeadlineTimerProps {
  vulnerability: Vulnerability
}

export function DeadlineTimer({ vulnerability }: DeadlineTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(calculateDeadlineRemaining(vulnerability.reportingDeadline))

  const isResolved = vulnerability.status === "resolved"

  useEffect(() => {
    if (isResolved) return

    const interval = setInterval(() => {
      setTimeRemaining(calculateDeadlineRemaining(vulnerability.reportingDeadline))
    }, 1000)

    return () => clearInterval(interval)
  }, [vulnerability.reportingDeadline, isResolved])

  const { hours, minutes, seconds, isOverdue, isCritical } = timeRemaining

  return (
    <Card
      className={cn(
        "rounded-3xl border transition-all hover:shadow-lg",
        isResolved
          ? "border-green-500/50 bg-green-500/5"
          : isOverdue
            ? "border-red-500/50 bg-red-500/5"
            : isCritical
              ? "border-primary/50 bg-primary/5"
              : "border-border/50 bg-card/50",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              isResolved
                ? "bg-green-500/10 text-green-600"
                : isOverdue
                  ? "bg-red-500/10 text-red-600"
                  : isCritical
                    ? "bg-primary/10 text-primary animate-pulse-amber"
                    : "bg-muted text-muted-foreground",
            )}
          >
            {isOverdue ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{vulnerability.cveId}</p>
            <p className="text-xs text-muted-foreground truncate">{vulnerability.title}</p>
          </div>

          <div className="text-right">
            <div
              className={cn(
                "text-lg font-bold tabular-nums",
                isResolved
                  ? "text-green-600"
                  : isOverdue
                    ? "text-red-600"
                    : isCritical
                      ? "text-primary"
                      : "text-foreground",
              )}
            >
              {isResolved
                ? "MET"
                : isOverdue
                  ? "NOT MET"
                  : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
            </div>
            <p className="text-xs text-muted-foreground">CRA Art. 14</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
