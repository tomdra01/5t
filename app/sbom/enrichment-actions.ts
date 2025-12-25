"use server"

import { createClient } from "@/utils/supabase/server"
import { fetchNvdData } from "@/lib/utils/nvd"
import { getSettings } from "@/app/settings/actions"

export async function enrichVulnerabilitiesAction(projectId: string) {
    const supabase = await createClient()
    const settings = await getSettings()
    const apiKey = settings?.nvd_api_key

    // 1. Get vulnerabilities for the project that don't have NVD data yet
    const { data: vulns, error } = await supabase
        .from("vulnerabilities")
        .select("id, cve_id, component_id, sbom_components!inner(project_id)")
        .eq("sbom_components.project_id", projectId)
        .is("nvd_score", null) // Only fetch missing ones
        .limit(50)

    if (error) {
        console.error("Error fetching vulns for enrichment:", error)
        return { success: false, message: "Database error" }
    }

    if (!vulns || vulns.length === 0) {
        return { success: true, message: "No unenriched vulnerabilities found.", count: 0 }
    }

    let enrichedCount = 0
    const BATCH_SIZE = apiKey ? 5 : 1; // Conservative concurrency

    // Process in batches
    for (let i = 0; i < vulns.length; i += BATCH_SIZE) {
        const batch = vulns.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (vuln) => {
            if (!vuln.cve_id.startsWith("CVE-")) return;

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
        }));

        // Rate limit delay between batches to be safe
        // With API key: 50 requests / 0.6s -> effectively unlimited for small batches
        // Without API key: 50 requests / 30s -> roughly 1.6 req/s. 
        // Our batch size 1 means we need ~600ms delays.
        if (!apiKey) {
            await new Promise(resolve => setTimeout(resolve, 600))
        } else {
            // Small breathing room even with key
            await new Promise(resolve => setTimeout(resolve, 100))
        }
    }

    return { success: true, message: `Enriched ${enrichedCount} vulnerabilities.`, count: enrichedCount }
}
