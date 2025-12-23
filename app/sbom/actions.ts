"use server"

import { createClient } from "@/utils/supabase/server"
import type { SbomComponentRow, VulnerabilityRow } from "@/types/db"

interface CycloneDxComponent {
  name?: string
  version?: string
  purl?: string
  author?: string
  licenses?: Array<{ license?: { name?: string; id?: string } }>
  license?: { name?: string; id?: string }
}

interface CycloneDxBom {
  components?: CycloneDxComponent[]
}

interface OsvSeverity {
  type?: string
  score?: string
}

interface OsvVulnerability {
  id: string
  summary?: string
  details?: string
  severity?: OsvSeverity[]
}

interface OsvResponse {
  vulns?: OsvVulnerability[]
}

interface UploadSbomInput {
  projectId: string
  sbom: CycloneDxBom
}

interface UploadSbomResult {
  success: boolean
  message: string
  componentsInserted: number
  vulnerabilitiesInserted: number
  errors?: string[]
}

const extractLicense = (component: CycloneDxComponent) => {
  const primary = component.licenses?.[0]?.license
  return primary?.name || primary?.id || component.license?.name || component.license?.id || null
}

const toSeverity = (severity?: OsvSeverity[]) => {
  const scoreValue = severity?.[0]?.score ? Number.parseFloat(severity[0].score) : Number.NaN
  if (Number.isNaN(scoreValue)) {
    return "High"
  }
  if (scoreValue >= 9) {
    return "Critical"
  }
  if (scoreValue >= 7) {
    return "High"
  }
  if (scoreValue >= 4) {
    return "Medium"
  }
  return "Low"
}

export async function uploadSbomAction({ projectId, sbom }: UploadSbomInput): Promise<UploadSbomResult> {
  if (!projectId) {
    return { success: false, message: "Missing project ID.", componentsInserted: 0, vulnerabilitiesInserted: 0 }
  }

  const components = sbom.components ?? []
  if (components.length === 0) {
    return { success: false, message: "No components found in SBOM.", componentsInserted: 0, vulnerabilitiesInserted: 0 }
  }

  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return { success: false, message: "Sign in to upload an SBOM.", componentsInserted: 0, vulnerabilitiesInserted: 0 }
  }

  let componentsInserted = 0
  let vulnerabilitiesInserted = 0
  const errors: string[] = []

  for (const component of components) {
    // Check if component exists
    const { data: existing } = await supabase
      .from("sbom_components")
      .select("id")
      .eq("project_id", projectId)
      .eq("name", component.name ?? "Unknown")
      .eq("version", component.version ?? "Unknown")
      .single()

    let insertedId: string | null = existing?.id ?? null

    if (existing) {
      // Update the timestamp to indicate it was seen again
      const { error: updateError } = await supabase
        .from("sbom_components")
        .update({ added_at: new Date().toISOString() })
        .eq("id", existing.id)

      if (updateError) {
        errors.push(`Failed to update timestamp for ${component.name}.`)
      }
    } else {
      // Insert new component
      const { data: inserted, error: insertError } = await supabase
        .from("sbom_components")
        .insert({
          project_id: projectId,
          name: component.name ?? "Unknown",
          version: component.version ?? "Unknown",
          purl: component.purl ?? null,
          license: extractLicense(component),
          author: component.author ?? null,
        })
        .select("id")
        .single<SbomComponentRow>()

      if (insertError || !inserted) {
        errors.push(insertError?.message ?? "Failed to insert SBOM component.")
        continue
      }
      insertedId = inserted.id
      componentsInserted += 1
    }

    if (!insertedId) continue

    // Proceed with vulnerability scan (fresh scan for existing components too)
    if (!component.purl) {
      continue
    }

    try {
      const response = await fetch("https://api.osv.dev/v1/query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ package: { purl: component.purl } }),
        cache: "no-store",
      })

      if (!response.ok) {
        errors.push(`OSV lookup failed for ${component.name ?? "component"}.`)
        continue
      }

      const scanResult = (await response.json()) as OsvResponse
      const vulns = scanResult.vulns ?? []

      for (const vuln of vulns) {
        // Check if vulnerability already exists for this component
        const { data: existingVuln } = await supabase
          .from("vulnerabilities")
          .select("id")
          .eq("component_id", insertedId)
          .eq("cve_id", vuln.id)
          .single()

        if (existingVuln) {
          // Update updated_at
          await supabase
            .from("vulnerabilities")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", existingVuln.id)
          continue
        }

        const { error: vulnError } = await supabase.from("vulnerabilities").insert({
          component_id: insertedId,
          cve_id: vuln.id,
          severity: toSeverity(vuln.severity),
          status: "Open",
          remediation_notes: vuln.summary || vuln.details || "Awaiting initial triage",
        } satisfies Partial<VulnerabilityRow>)

        if (!vulnError) {
          vulnerabilitiesInserted += 1
        } else {
          errors.push(vulnError.message)
        }
      }
    } catch {
      errors.push(`OSV lookup failed for ${component.name ?? "component"}.`)
    }
  }

  const success = componentsInserted > 0

  return {
    success,
    message: success
      ? "SBOM processed and vulnerabilities scanned."
      : errors[0] ?? "No components were saved. Check RLS policies for sbom_components.",
    componentsInserted,
    vulnerabilitiesInserted,
    errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
  }
}
