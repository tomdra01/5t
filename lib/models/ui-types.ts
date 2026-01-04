export type VulnerabilitySeverity = "critical" | "high" | "medium" | "low"

export type VulnerabilityStatus = "discovered" | "reported" | "in-remediation" | "resolved"

export interface UIVulnerability {
  id: string
  cveId: string
  title: string
  severity: VulnerabilitySeverity
  cvssScore: number
  affectedComponent: string
  discoveredAt: Date
  reportingDeadline: Date
  remediationDeadline: Date
  status: VulnerabilityStatus
  ownership: string
  remediationStatus: string
  description?: string
}

export interface UIComponent {
  id: string
  name: string
  version: string
  type: "library" | "framework" | "application" | "os" | "other"
  license?: string
  purl?: string
  author?: string
  vulnerabilities: number
  lastUpdated: Date
}

export interface UIComplianceReport {
  id: string
  generatedAt: Date
  reportingPeriod: {
    start: Date
    end: Date
  }
  totalVulnerabilities: number
  resolvedVulnerabilities: number
  activeVulnerabilities: number
  criticalCount: number
  complianceScore: number
  earlyWarningReports: number
  remediationEfforts: UIRemediationEffort[]
}

export interface UIRemediationEffort {
  vulnerabilityId: string
  action: string
  takenAt: Date
  outcome: string
}

export type ComplianceStatus = "compliant" | "warning" | "critical" | "pending"

export interface UIDashboardStats {
  critical24hReports: number
  vulnerabilityHealthScore: number
  totalComponents: number
  vulnerableComponents: number
  complianceStatus: ComplianceStatus
}
