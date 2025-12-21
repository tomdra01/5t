export interface ComplianceReportSummary {
  success: boolean
  message: string
  criticalCount: number
  averageRemediationHours: number | null
  deadlinesMetPercent: number
  totalVulnerabilities: number
}
