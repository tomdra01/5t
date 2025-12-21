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

  for (const component of components) {
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
      continue
    }

    componentsInserted += 1

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
        continue
      }

      const scanResult = (await response.json()) as OsvResponse
      const vulns = scanResult.vulns ?? []

      for (const vuln of vulns) {
        const { error: vulnError } = await supabase.from("vulnerabilities").insert({
          component_id: inserted.id,
          cve_id: vuln.id,
          severity: toSeverity(vuln.severity),
          status: "Open",
          remediation_notes: vuln.summary || vuln.details || "Awaiting initial triage",
        } satisfies Partial<VulnerabilityRow>)

        if (!vulnError) {
          vulnerabilitiesInserted += 1
        }
      }
    } catch {
      // Ignore OSV errors per component to keep ingestion resilient.
    }
  }

  return {
    success: true,
    message: "SBOM processed and vulnerabilities scanned.",
    componentsInserted,
    vulnerabilitiesInserted,
  }
}
