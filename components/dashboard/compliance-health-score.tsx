"use client"

import { cn } from "@/lib/utils"

interface ComplianceHealthScoreProps {
  totalVulnerabilities: number
  overdueDeadlines: number
}

export function ComplianceHealthScore({ totalVulnerabilities, overdueDeadlines }: ComplianceHealthScoreProps) {
  const score =
    totalVulnerabilities === 0
      ? 100
      : Math.max(0, Math.round(((totalVulnerabilities - overdueDeadlines) / totalVulnerabilities) * 100))

  const ringStyle = {
    background: `conic-gradient(#0f766e ${score * 3.6}deg, rgba(15, 118, 110, 0.15) 0deg)`,
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 rounded-full p-[3px]" style={ringStyle}>
        <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
          <span className="text-sm font-semibold text-teal-700">{score}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Compliance Health Score</p>
        <p
          className={cn(
            "text-xl font-semibold",
            score >= 85 ? "text-emerald-700" : score >= 60 ? "text-amber-600" : "text-destructive",
          )}
        >
          {score}%
        </p>
        <p className="text-xs text-muted-foreground">Based on overdue deadlines</p>
      </div>
    </div>
  )
}
