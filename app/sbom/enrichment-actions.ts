"use server"

import { createClient } from "@/utils/supabase/server"
import { fetchNvdData } from "@/lib/utils/nvd"
import { getSettings } from "@/app/settings/actions"

export async function enrichVulnerabilitiesAction(projectId: string) {
    const supabase = await createClient()
    const settings = await getSettings()
    const apiKey = settings?.nvd_api_key

    const { data: vulns, error } = await supabase
        .from("vulnerabilities")
        .select("id, cve_id, component_id, sbom_components!inner(project_id)")
        .eq("sbom_components.project_id", projectId)
        .is("nvd_score", null)
        .limit(50)

    if (error) {
        console.error("Error fetching vulns for enrichment:", error)
        return { success: false, message: "Database error" }
    }

    if (!vulns || vulns.length === 0) {
        return { success: true, message: "No unenriched vulnerabilities found.", count: 0 }
    }

    let enrichedCount = 0
    const BATCH_SIZE = apiKey ? 5 : 1
    const DELAY = apiKey ? 100 : 600

    for (let i = 0; i < vulns.length; i += BATCH_SIZE) {
        const batch = vulns.slice(i, i + BATCH_SIZE)

        await Promise.all(batch.map(async (vuln) => {
            if (!vuln.cve_id.startsWith("CVE-")) return

            const nvdData = await fetchNvdData(vuln.cve_id, apiKey)
            if (nvdData) {
                await supabase
                    .from("vulnerabilities")
                    .update({
                        nvd_score: nvdData.nvd_score,
                        nvd_severity: nvdData.nvd_severity,
                        source: nvdData.source
                    })
                    .eq("id", vuln.id)
                enrichedCount++
            }
        }))

        await new Promise(resolve => setTimeout(resolve, DELAY))
    }

    return { success: true, message: `Enriched ${enrichedCount} vulnerabilities.`, count: enrichedCount }
}
