"use server"

import { createClient } from "@/utils/supabase/server"
import type { ComplianceReportSummary } from "@/types/compliance"
import type { SbomComponentRow, VulnerabilityRow } from "@/types/db"

interface GenerateComplianceReportInput {
  projectId: string
}

export async function generateComplianceReport({
  projectId,
}: GenerateComplianceReportInput): Promise<ComplianceReportSummary> {
  if (!projectId) {
    return {
      success: false,
      message: "Missing project ID.",
      criticalCount: 0,
      averageRemediationHours: null,
      deadlinesMetPercent: 0,
      totalVulnerabilities: 0,
    }
  }

  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return {
      success: false,
      message: "Sign in to generate reports.",
      criticalCount: 0,
      averageRemediationHours: null,
      deadlinesMetPercent: 0,
      totalVulnerabilities: 0,
    }
  }

  const { data: componentRows, error: componentError } = await supabase
    .from("sbom_components")
    .select("id,project_id,name,version,purl,license,author,added_at")
    .eq("project_id", projectId)

  if (componentError) {
    return {
      success: false,
      message: "Unable to load SBOM components for this project.",
      criticalCount: 0,
      averageRemediationHours: null,
      deadlinesMetPercent: 0,
      totalVulnerabilities: 0,
    }
  }

  const components = (componentRows ?? []) as SbomComponentRow[]
  const componentIds = components.map((component) => component.id)
  if (componentIds.length === 0) {
    return {
      success: true,
      message: "No components available for reporting.",
      criticalCount: 0,
      averageRemediationHours: null,
      deadlinesMetPercent: 0,
      totalVulnerabilities: 0,
    }
  }

  const { data: vulnRows, error: vulnError } = await supabase
    .from("vulnerabilities")
    .select("id,component_id,cve_id,severity,status,assigned_to,remediation_notes,discovered_at,reporting_deadline,updated_at")
    .in("component_id", componentIds)

  if (vulnError) {
    return {
      success: false,
      message: "Unable to load vulnerabilities for this project.",
      criticalCount: 0,
      averageRemediationHours: null,
      deadlinesMetPercent: 0,
      totalVulnerabilities: 0,
    }
  }

  const vulnerabilities = (vulnRows ?? []) as VulnerabilityRow[]
  const totalVulnerabilities = vulnerabilities.length
  const criticalCount = vulnerabilities.filter(
    (vuln) => (vuln.severity ?? "").toLowerCase() === "critical",
  ).length

  const remediationDurations = vulnerabilities
    .filter((vuln) => {
      const status = (vuln.status ?? "").toLowerCase()
      return status === "patched" || status === "resolved"
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

  const { error: reportError } = await supabase.from("compliance_reports").insert({
    project_id: projectId,
    report_type: "Annex_I_Summary",
  })

  if (reportError) {
    return {
      success: false,
      message: `Report generated but failed to log: ${reportError.message}`,
      criticalCount,
      averageRemediationHours,
      deadlinesMetPercent,
      totalVulnerabilities,
    }
  }

  return {
    success: true,
    message: "Compliance report generated.",
    criticalCount,
    averageRemediationHours,
    deadlinesMetPercent,
    totalVulnerabilities,
  }
}
