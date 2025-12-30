import type { VulnerabilityRow } from "@/types/db"

export function calculateRemediationStats(vulnerabilities: VulnerabilityRow[]) {
    const totalVulnerabilities = vulnerabilities.length
    const criticalCount = vulnerabilities.filter(
        (vuln) => (vuln.severity ?? "").toLowerCase() === "critical",
    ).length

    const remediationDurations = vulnerabilities
        .filter((vuln) => {
            const status = (vuln.status ?? "").toLowerCase()
            // Accept both database and UI status variants
            return ["patched", "resolved"].includes(status)
        })
        .map((vuln) => {
            if (!vuln.updated_at) {
                return null
            }
            const discovered = new Date(vuln.discovered_at)
            const resolved = new Date(vuln.updated_at)
            const diffMs = resolved.getTime() - discovered.getTime()
            return diffMs > 0 ? diffMs : null
        })
        .filter((value): value is number => typeof value === "number")

    const averageRemediationHours =
        remediationDurations.length > 0
            ? Math.round((remediationDurations.reduce((sum, value) => sum + value, 0) / remediationDurations.length) / 3600000)
            : null

    const deadlineCandidates = vulnerabilities.filter((vuln) => vuln.reporting_deadline && vuln.updated_at)
    const metDeadlines = deadlineCandidates.filter((vuln) => {
        const updatedAt = new Date(vuln.updated_at as string)
        const deadline = new Date(vuln.reporting_deadline)
        return updatedAt.getTime() <= deadline.getTime()
    }).length

    const deadlinesMetPercent =
        deadlineCandidates.length > 0 ? Math.round((metDeadlines / deadlineCandidates.length) * 100) : 0

    return {
        totalVulnerabilities,
        criticalCount,
        averageRemediationHours,
        deadlinesMetPercent,
    }
}
