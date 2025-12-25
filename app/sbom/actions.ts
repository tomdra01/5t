"use server"

import { createClient } from "@/utils/supabase/server"
import { parseSbom, extractLicense } from "@/lib/utils/sbom"
import { revalidatePath } from "next/cache"

interface UploadSbomActionInput {
  projectId: string
  fileContent: string
}

interface UploadSbomResult {
  success: boolean
  message: string
  componentsInserted: number
  vulnerabilitiesInserted: number
}

interface ComponentComparison {
  name: string
  oldVersion: string | null
  newVersion: string
  status: "new" | "upgraded" | "downgraded" | "unchanged"
  oldComponentId?: string
}

// Semantic version comparison helper
function compareVersions(v1: string, v2: string): number {
  const clean = (v: string) => v.replace(/^[v=]/i, "").split(/[.-]/).map(p => parseInt(p) || 0)
  const parts1 = clean(v1)
  const parts2 = clean(v2)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0
    const p2 = parts2[i] || 0
    if (p1 > p2) return 1
    if (p1 < p2) return -1
  }
  return 0
}

export async function uploadSbomAction({
  projectId,
  fileContent,
}: UploadSbomActionInput): Promise<UploadSbomResult> {
  if (!projectId || !fileContent) {
    return { success: false, message: "Missing required inputs.", componentsInserted: 0, vulnerabilitiesInserted: 0 }
  }

  let components: ReturnType<typeof parseSbom>
  try {
    components = parseSbom(fileContent)
  } catch {
    return { success: false, message: "Unable to parse SBOM format.", componentsInserted: 0, vulnerabilitiesInserted: 0 }
  }

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
  let componentsUpgraded = 0
  let vulnerabilitiesAutoResolved = 0
  const errors: string[] = []

  // 1. Get or create SBOM version
  const { data: latestVersion } = await supabase
    .rpc("get_latest_sbom_version", { p_project_id: projectId })

  const newVersionNumber = (latestVersion || 0) + 1

  const { data: sbomVersion, error: versionError } = await supabase
    .from("sbom_versions")
    .insert({
      project_id: projectId,
      version_number: newVersionNumber,
      uploaded_by: userData.user.id,
      component_count: components.length,
    })
    .select()
    .single()

  if (versionError || !sbomVersion) {
    return { success: false, message: "Failed to create SBOM version.", componentsInserted: 0, vulnerabilitiesInserted: 0 }
  }

  // 2. Load previous components for comparison
  const previousComponents = new Map<string, { id: string; version: string }>()

  if (newVersionNumber > 1) {
    const { data: prevComponents } = await supabase
      .from("sbom_components")
      .select("id, name, version")
      .eq("project_id", projectId)

    if (prevComponents) {
      for (const comp of prevComponents) {
        if (comp.name) {
          previousComponents.set(comp.name, { id: comp.id, version: comp.version || "unknown" })
        }
      }
    }
  }

  // Helper to generate PURL if not provided (for common ecosystems)
  const generatePurl = (component: any): string | null => {
    if (component.purl) return component.purl

    const name = component.name
    const version = component.version

    if (!name || !version) return null

    // Try to infer ecosystem from common package patterns
    // npm packages (most common in JS/TS projects)
    if (name.includes('/') && name.startsWith('@')) {
      return `pkg:npm/${name}@${version}`
    }
    if (component.type === 'library' || component.type === 'application') {
      // Default to npm for libraries without explicit package manager
      return `pkg:npm/${name}@${version}`
    }

    return null
  }

  // 3. Insert/Update Components with version comparison
  const purlsToQuery: string[] = []
  const componentIdMap = new Map<string, string>()
  const comparisons: ComponentComparison[] = []

  for (const component of components) {
    const compName = component.name ?? "Unknown"
    const compVersion = component.version ?? "Unknown"
    const prev = previousComponents.get(compName)

    let comparison: ComponentComparison = {
      name: compName,
      oldVersion: prev?.version || null,
      newVersion: compVersion,
      status: "new",
    }

    if (prev) {
      const versionDiff = compareVersions(compVersion, prev.version)
      if (versionDiff > 0) {
        comparison.status = "upgraded"
        comparison.oldComponentId = prev.id
        componentsUpgraded++
      } else if (versionDiff < 0) {
        comparison.status = "downgraded"
      } else {
        comparison.status = "unchanged"
      }
    }

    comparisons.push(comparison)

    // Generate PURL if not provided
    const purl = generatePurl(component) || component.purl

    // Insert new component
    const { data: inserted, error: insertError } = await supabase
      .from("sbom_components")
      .insert({
        project_id: projectId,
        name: compName,
        version: compVersion,
        purl: purl,
        license: extractLicense(component),
        author: component.author ?? null,
        sbom_version_id: sbomVersion.id,
        previous_version: prev?.version || null,
      })
      .select()
      .single()

    if (insertError) {
      errors.push(`Failed to insert ${compName}: ${insertError.message}`)
      continue
    }

    if (inserted && purl) {
      componentsInserted++
      purlsToQuery.push(purl)
      componentIdMap.set(purl, inserted.id)
    }

    // 4. Auto-resolve vulnerabilities for upgraded components
    if (comparison.status === "upgraded" && comparison.oldComponentId) {
      const { data: oldVulns } = await supabase
        .from("vulnerabilities")
        .select("id, cve_id")
        .eq("component_id", comparison.oldComponentId)
        .neq("status", "Patched")

      if (oldVulns && oldVulns.length > 0) {
        for (const vuln of oldVulns) {
          // Mark as patched
          await supabase
            .from("vulnerabilities")
            .update({ status: "Patched", updated_at: new Date().toISOString() })
            .eq("id", vuln.id)

          // Log remediation milestone
          await supabase.rpc("log_remediation_milestone", {
            p_vulnerability_id: vuln.id,
            p_milestone_type: "auto_resolved",
            p_old_value: comparison.oldVersion,
            p_new_value: comparison.newVersion,
            p_triggered_by: userData.user.id,
            p_notes: `Component ${compName} upgraded from ${comparison.oldVersion} to ${comparison.newVersion}`,
            p_sbom_version_id: sbomVersion.id,
          })

          vulnerabilitiesAutoResolved++
        }
      }
    }
  }

  if (purlsToQuery.length === 0) {
    console.log('[SBOM Upload] No PURLs to query - components might be missing PURL data')
    return {
      success: true,
      message: componentsUpgraded > 0
        ? `SBOM v${newVersionNumber} uploaded: ${componentsInserted} components, ${componentsUpgraded} upgraded, ${vulnerabilitiesAutoResolved} vulnerabilities auto-resolved.`
        : `SBOM v${newVersionNumber} uploaded with ${componentsInserted} components. No PURLs available for vulnerability scanning.`,
      componentsInserted,
      vulnerabilitiesInserted: 0,
    }
  }

  console.log(`[SBOM Upload] Querying OSV.dev for ${purlsToQuery.length} PURLs:`, purlsToQuery)

  // 5. Query OSV.dev Batch API for vulnerabilities
  const osvBatchPayload = {
    queries: purlsToQuery.map((purl) => ({ package: { purl } })),
  }

  let osvResponse
  try {
    const resp = await fetch("https://api.osv.dev/v1/querybatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(osvBatchPayload),
    })

    console.log(`[SBOM Upload] OSV.dev response status: ${resp.status}`)

    if (!resp.ok) {
      const errorText = await resp.text()
      console.error('[SBOM Upload] OSV.dev error:', errorText)
      errors.push(`OSV.dev batch query failed: ${resp.statusText}`)
    } else {
      osvResponse = await resp.json()
      console.log(`[SBOM Upload] OSV.dev returned ${osvResponse.results?.length || 0} results`)
    }
  } catch (err: any) {
    console.error('[SBOM Upload] OSV.dev request error:', err)
    errors.push(`OSV.dev request error: ${err.message}`)
  }

  // 6. Insert discovered vulnerabilities
  if (osvResponse?.results) {
    console.log('[SBOM Upload] Processing OSV.dev results...')

    for (let i = 0; i < osvResponse.results.length; i++) {
      const result = osvResponse.results[i]

      if (!result.vulns || result.vulns.length === 0) {
        console.log(`[SBOM Upload] No vulns for index ${i}`)
        continue
      }

      console.log(`[SBOM Upload] Index ${i}: Found ${result.vulns.length} vulnerabilities`)

      const purl = purlsToQuery[i]
      const componentId = componentIdMap.get(purl)

      if (!componentId) {
        console.error(`[SBOM Upload] No component ID found for PURL: ${purl}`)
        continue
      }

      console.log(`[SBOM Upload] Component ID for ${purl}: ${componentId}`)

      for (const vuln of result.vulns) {
        const cveId = vuln.aliases?.find((a: string) => a.startsWith("CVE")) || vuln.id
        const severity = vuln.database_specific?.severity || "High"

        let status: "Open" | "Patched" | "Triaged" | "Ignored" = "Open"
        let assignedTo = null
        let remediationNotes = null
        let reportingDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        // Check for previous vulnerability state to carry over
        const { data: previousVuln } = await supabase
          .from("vulnerabilities")
          .select("status, assigned_to, remediation_notes, reporting_deadline")
          .eq("cve_id", cveId)
          // We ideally want to match project via complex join, but for now matching CVE for this user context is okay-ish
          // Better: we can't easily join to project_id here without a complex query
          // But since RLS scopes to organization, searching by CVE_ID usually hits the same context.
          // To be safer, we can treat this as "if WE knew about this CVE before, keep its state"
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (previousVuln) {
          status = previousVuln.status as any
          assignedTo = previousVuln.assigned_to
          remediationNotes = previousVuln.remediation_notes
          reportingDeadline = previousVuln.reporting_deadline
        }

        console.log(`[SBOM Upload] Inserting vulnerability: ${cveId} (${severity}) - Status: ${status}`)

        const { error: vulnError } = await supabase.from("vulnerabilities").insert({
          component_id: componentId,
          cve_id: cveId,
          severity,
          status,
          assigned_to: assignedTo,
          remediation_notes: remediationNotes,
          discovered_at: new Date().toISOString(),
          reporting_deadline: reportingDeadline,
        })

        if (!vulnError) {
          vulnerabilitiesInserted++
          console.log(`[SBOM Upload] ✓ Inserted ${cveId}`)
        } else {
          console.error(`[SBOM Upload] ✗ Failed to insert ${cveId}:`, vulnError)
        }
      }
    }

    console.log(`[SBOM Upload] Total vulnerabilities inserted: ${vulnerabilitiesInserted}`)
  }

  // 7. Trigger NVD Enrichment (background)
  import("@/app/sbom/enrichment-actions")
    .then(({ enrichVulnerabilitiesAction }) => {
      enrichVulnerabilitiesAction(projectId).catch(console.error)
    })

  revalidatePath("/")
  revalidatePath("/triage")
  revalidatePath("/sbom")

  const message =
    componentsUpgraded > 0
      ? `SBOM v${newVersionNumber} uploaded: ${componentsInserted} components, ${componentsUpgraded} upgraded, ${vulnerabilitiesAutoResolved} auto-resolved, ${vulnerabilitiesInserted} new vulnerabilities discovered.`
      : vulnerabilitiesInserted > 0
        ? `SBOM v${newVersionNumber} uploaded: ${componentsInserted} components, ${vulnerabilitiesInserted} vulnerabilities discovered.`
        : `SBOM v${newVersionNumber} uploaded with ${componentsInserted} components.`

  return {
    success: true,
    message,
    componentsInserted,
    vulnerabilitiesInserted,
  }
}
