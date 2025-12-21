// Type definitions for CRA compliance dashboard

export type ComplianceStatus = "compliant" | "warning" | "critical" | "pending"

export type VulnerabilitySeverity = "critical" | "high" | "medium" | "low"

export interface Vulnerability {
  id: string
  cveId: string
  title: string
  severity: VulnerabilitySeverity
  cvssScore: number
  affectedComponent: string
  discoveredAt: Date
  reportingDeadline: Date
  remediationDeadline: Date
  status: "discovered" | "reported" | "in-remediation" | "resolved"
  ownership: string
  remediationStatus: string
  description?: string
}

export interface SBOMComponent {
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

export interface ComplianceReport {
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
  remediationEfforts: RemediationEffort[]
}

export interface RemediationEffort {
  vulnerabilityId: string
  action: string
  takenAt: Date
  outcome: string
}

export interface DashboardStats {
  critical24hReports: number
  vulnerabilityHealthScore: number
  totalComponents: number
  vulnerableComponents: number
  complianceStatus: ComplianceStatus
}
