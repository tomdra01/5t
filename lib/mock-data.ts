import type { Vulnerability, SBOMComponent, DashboardStats, ComplianceReport } from "@/types"

// Mock data for development and demonstration
export const mockVulnerabilities: Vulnerability[] = [
  {
    id: "vuln-001",
    cveId: "CVE-2024-1234",
    title: "Critical Buffer Overflow in OpenSSL",
    severity: "critical",
    cvssScore: 9.8,
    affectedComponent: "openssl@1.1.1k",
    discoveredAt: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
    reportingDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    remediationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "discovered",
    ownership: "Security Team",
    remediationStatus: "Patch Available",
    description: "Remote code execution vulnerability in SSL handshake",
  },
  {
    id: "vuln-002",
    cveId: "CVE-2024-5678",
    title: "SQL Injection in PostgreSQL Driver",
    severity: "high",
    cvssScore: 8.1,
    affectedComponent: "pg@8.7.3",
    discoveredAt: new Date(Date.now() - 15 * 60 * 60 * 1000),
    reportingDeadline: new Date(Date.now() + 9 * 60 * 60 * 1000),
    remediationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: "reported",
    ownership: "Backend Team",
    remediationStatus: "In Progress",
  },
  {
    id: "vuln-003",
    cveId: "CVE-2024-9012",
    title: "XSS Vulnerability in React Component",
    severity: "medium",
    cvssScore: 6.5,
    affectedComponent: "react-markdown@7.1.0",
    discoveredAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    reportingDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // Overdue
    remediationDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    status: "in-remediation",
    ownership: "Frontend Team",
    remediationStatus: "Testing Fix",
  },
]

export const mockSBOMComponents: SBOMComponent[] = [
  {
    id: "comp-001",
    name: "openssl",
    version: "1.1.1k",
    type: "library",
    license: "OpenSSL",
    vulnerabilities: 1,
    lastUpdated: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  },
  {
    id: "comp-002",
    name: "react",
    version: "18.2.0",
    type: "framework",
    license: "MIT",
    vulnerabilities: 0,
    lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "comp-003",
    name: "postgresql",
    version: "14.5",
    type: "application",
    license: "PostgreSQL",
    vulnerabilities: 1,
    lastUpdated: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
  },
]

export const mockDashboardStats: DashboardStats = {
  critical24hReports: 2,
  vulnerabilityHealthScore: 73,
  totalComponents: 127,
  vulnerableComponents: 8,
  complianceStatus: "warning",
}

export const mockComplianceReport: ComplianceReport = {
  id: "report-2024-q1",
  generatedAt: new Date(),
  reportingPeriod: {
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
  totalVulnerabilities: 15,
  resolvedVulnerabilities: 10,
  activeVulnerabilities: 5,
  criticalCount: 2,
  complianceScore: 73,
  earlyWarningReports: 8,
  remediationEfforts: [
    {
      vulnerabilityId: "vuln-001",
      action: "Applied security patch OpenSSL 1.1.1w",
      takenAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      outcome: "Vulnerability mitigated, system tested and deployed",
    },
    {
      vulnerabilityId: "vuln-002",
      action: "Updated PostgreSQL driver to version 8.11.0",
      takenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      outcome: "SQL injection vulnerability resolved",
    },
    {
      vulnerabilityId: "vuln-003",
      action: "Implemented input sanitization in React components",
      takenAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      outcome: "XSS vulnerability patched, awaiting final review",
    },
  ],
}
