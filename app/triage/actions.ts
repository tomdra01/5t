"use server"

import { createClient } from "@/utils/supabase/server"
import type { ComplianceReportSummary } from "@/types/compliance"
import type { SbomComponentRow, VulnerabilityRow } from "@/types/db"

interface UpdateVulnerabilityInput {
  vulnerabilityId: string
  status?: string
  assignedTo?: string | null
  remediationNotes?: string | null
}

interface UpdateVulnerabilityResult {
  success: boolean
  message: string
}

export async function updateVulnerabilityAction({
  vulnerabilityId,
  status,
  assignedTo,
  remediationNotes,
}: UpdateVulnerabilityInput): Promise<UpdateVulnerabilityResult> {
  const supabase = await createClient()

  // Verify auth
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return { success: false, message: "Sign in to update vulnerabilities." }
  }

  const updates: Partial<VulnerabilityRow> = {
    updated_at: new Date().toISOString(),
  }

  if (status !== undefined) {
    // Map UI status to DB status
    let dbStatus = status
    switch (status) {
      case "discovered":
        dbStatus = "Open"
        break
      case "in-remediation":
        dbStatus = "Triaged"
        break
      case "resolved":
        dbStatus = "Patched"
        break
      case "reported":
        dbStatus = "Reported"
        break
    }
    updates.status = dbStatus
  }
  if (assignedTo !== undefined) updates.assigned_to = assignedTo
  if (remediationNotes !== undefined) updates.remediation_notes = remediationNotes

  const { error } = await supabase
    .from("vulnerabilities")
    .update(updates)
    .eq("id", vulnerabilityId)

  if (error) {
    return { success: false, message: `Update failed: ${error.message}` }
  }

  return { success: true, message: "Vulnerability updated successfully." }
}


import { calculateRemediationStats } from "@/lib/metrics"

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
  const stats = calculateRemediationStats(vulnerabilities)

  const { error: reportError } = await supabase.from("compliance_reports").insert({
    project_id: projectId,
    report_type: "Annex_I_Summary",
  })

  if (reportError) {
    return {
      success: false,
      message: `Report generated but failed to log: ${reportError.message}`,
      ...stats,
    }
  }

  return {
    success: true,
    message: "Compliance report generated.",
    ...stats,
  }
}

