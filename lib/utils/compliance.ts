import type { Vulnerability } from "@/types"

/**
 * Calculate time remaining until CRA Article 14 24-hour reporting deadline
 */
export function calculateDeadlineRemaining(deadline: Date): {
  hours: number
  minutes: number
  seconds: number
  isOverdue: boolean
  isCritical: boolean
} {
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()

  if (diff < 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      isOverdue: true,
      isCritical: true,
    }
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return {
    hours,
    minutes,
    seconds,
    isOverdue: false,
    isCritical: hours < 6, // Critical if less than 6 hours remaining
  }
}

/**
 * Calculate compliance health score based on vulnerability metrics
 */
export function calculateComplianceScore(
  totalVulns: number,
  resolvedVulns: number,
  criticalVulns: number,
  overdueReports: number,
): number {
  if (totalVulns === 0) return 100

  const resolutionRate = (resolvedVulns / totalVulns) * 100
  const criticalPenalty = criticalVulns * 5
  const overduePenalty = overdueReports * 10

  const score = Math.max(0, resolutionRate - criticalPenalty - overduePenalty)
  return Math.round(score)
}

/**
 * Format deadline for display
 */
export function formatDeadline(deadline: Date): string {
  const { hours, minutes, isOverdue } = calculateDeadlineRemaining(deadline)

  if (isOverdue) return "OVERDUE"
  return `${hours}h ${minutes}m`
}

/**
 * Determine if vulnerability requires immediate early warning report (CRA Art. 14)
 */
export function requiresEarlyWarning(vuln: Vulnerability): boolean {
  return (vuln.severity === "critical" || vuln.cvssScore >= 9.0) && vuln.status === "discovered"
}
