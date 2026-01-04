"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { updateVulnerabilitySchema } from "@/lib/validators/vulnerability"
import { VulnerabilityRepository } from "@/lib/repositories/vulnerability.repository"
import { ComponentRepository } from "@/lib/repositories/component.repository"
import { handleError, AuthenticationError } from "@/lib/errors"
import { calculateRemediationStats } from "@/lib/metrics"
import type { ComplianceReportSummary } from "@/types/compliance"

interface UpdateVulnerabilityResult {
  success: boolean
  message: string
}

export async function updateVulnerabilityAction(input: {
  vulnerabilityId: string
  status?: string
  assignedTo?: string | null
  remediationNotes?: string | null
}): Promise<UpdateVulnerabilityResult> {
  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      throw new AuthenticationError()
    }

    const statusMapping: Record<string, string> = {
      discovered: "Open",
      "in-remediation": "Triaged",
      resolved: "Patched",
    }

    const mappedStatus = input.status ? statusMapping[input.status] || input.status : undefined

    const validated = updateVulnerabilitySchema.parse({
      id: input.vulnerabilityId,
      status: mappedStatus,
      assigned_to: input.assignedTo,
      remediation_notes: input.remediationNotes,
    })

    const vulnerabilityRepo = new VulnerabilityRepository(supabase)
    const updated = await vulnerabilityRepo.update(validated.id, {
      status: validated.status as "Open" | "Triaged" | "Patched" | "Ignored" | undefined,
      assigned_to: validated.assigned_to,
      remediation_notes: validated.remediation_notes,
    })

    if (!updated) {
      return { success: false, message: "Failed to update vulnerability" }
    }

    revalidatePath("/triage")
    revalidatePath("/")

    return { success: true, message: "Vulnerability updated successfully" }
  } catch (error) {
    return handleError(error) as UpdateVulnerabilityResult
  }
}

export async function autoIgnorePastDeadlineAction(input: {
  projectId: string
}): Promise<{ success: boolean; message: string; ignoredCount: number }> {
  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      throw new AuthenticationError()
    }

    const vulnerabilityRepo = new VulnerabilityRepository(supabase)
    const ignoredCount = await vulnerabilityRepo.autoIgnorePastDeadline(input.projectId)

    revalidatePath("/triage")
    revalidatePath("/")

    return {
      success: true,
      message: ignoredCount > 0 ? `${ignoredCount} vulnerabilities auto-ignored due to missed deadlines` : "No vulnerabilities to auto-ignore",
      ignoredCount,
    }
  } catch (error) {
    const result = handleError(error)
    return {
      success: false,
      message: result.message,
      ignoredCount: 0,
    }
  }
}

export async function generateComplianceReport(input: {
  projectId: string
}): Promise<ComplianceReportSummary> {
  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      throw new AuthenticationError()
    }

    const componentRepo = new ComponentRepository(supabase)
    const components = await componentRepo.findByProjectId(input.projectId)

    if (components.length === 0) {
      return {
        success: true,
        message: "No components available for reporting",
        criticalCount: 0,
        averageRemediationHours: null,
        deadlinesMetPercent: 0,
        totalVulnerabilities: 0,
      }
    }

    const componentIds = components.map((c) => c.id)

    const { data: vulnRows, error: vulnError } = await supabase
      .from("vulnerabilities")
      .select("*")
      .in("component_id", componentIds)

    if (vulnError) {
      return {
        success: false,
        message: "Unable to load vulnerabilities for this project",
        criticalCount: 0,
        averageRemediationHours: null,
        deadlinesMetPercent: 0,
        totalVulnerabilities: 0,
      }
    }

    const vulnerabilities = vulnRows || []
    const stats = calculateRemediationStats(vulnerabilities)

    await supabase.from("compliance_reports").insert({
      project_id: input.projectId,
      report_type: "Annex_I_Summary",
    })

    return {
      success: true,
      message: "Compliance report generated",
      ...stats,
    }
  } catch (error) {
    const result = handleError(error)
    return {
      success: false,
      message: result.message,
      criticalCount: 0,
      averageRemediationHours: null,
      deadlinesMetPercent: 0,
      totalVulnerabilities: 0,
    }
  }
}
