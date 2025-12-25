import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

interface OsvVulnerability {
    id: string
    aliases?: string[]
    database_specific?: {
        severity?: string
    }
}

interface OsvResponse {
    vulns?: OsvVulnerability[]
}

export async function GET(request: NextRequest) {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get("authorization")
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    let scannedProjects = 0
    let newVulnerabilitiesFound = 0
    let componentsScanned = 0
    const errors: string[] = []

    try {
        // 1. Get all active projects
        const { data: projects, error: projectsError } = await supabase
            .from("projects")
            .select("id, name, organization_id")

        if (projectsError || !projects) {
            return NextResponse.json({
                success: false,
                error: "Failed to fetch projects",
                details: projectsError?.message
            }, { status: 500 })
        }

        // 2. For each project, scan its components
        for (const project of projects) {
            try {
                const { data: components } = await supabase
                    .from("sbom_components")
                    .select("id, name, version, purl")
                    .eq("project_id", project.id)
                    .not("purl", "is", null)

                if (!components || components.length === 0) continue

                componentsScanned += components.length

                // 3. Batch query OSV.dev for all components
                const queries = components
                    .filter(c => c.purl)
                    .map(c => ({ package: { purl: c.purl! } }))

                if (queries.length === 0) continue

                const osvResponse = await fetch("https://api.osv.dev/v1/querybatch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ queries }),
                })

                if (!osvResponse.ok) {
                    errors.push(`OSV query failed for project ${project.name}`)
                    continue
                }

                const batchResults = await osvResponse.json() as { results: OsvResponse[] }

                // 4. Process vulnerabilities
                for (let i = 0; i < batchResults.results.length; i++) {
                    const result = batchResults.results[i]
                    if (!result.vulns || result.vulns.length === 0) continue

                    const component = components[i]
                    if (!component) continue

                    for (const vuln of result.vulns) {
                        const cveId = vuln.aliases?.find(a => a.startsWith("CVE")) || vuln.id

                        // Check if we already have this vulnerability
                        const { data: existing } = await supabase
                            .from("vulnerabilities")
                            .select("id")
                            .eq("component_id", component.id)
                            .eq("cve_id", cveId)
                            .single()

                        if (existing) continue // Already tracked

                        // NEW vulnerability discovered - insert with 24h deadline
                        const severity = vuln.database_specific?.severity || "High"
                        const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000) // Article 15: 24h deadline

                        const { error: insertError } = await supabase
                            .from("vulnerabilities")
                            .insert({
                                component_id: component.id,
                                cve_id: cveId,
                                severity,
                                status: "Open",
                                discovered_at: new Date().toISOString(),
                                reporting_deadline: deadline.toISOString(),
                            })

                        if (!insertError) {
                            newVulnerabilitiesFound++

                            // Log remediation milestone
                            await supabase.rpc("log_remediation_milestone", {
                                p_vulnerability_id: null, // Will be set by trigger
                                p_milestone_type: "discovered",
                                p_old_value: null,
                                p_new_value: cveId,
                                p_triggered_by: null,
                                p_notes: `Discovered via daily scan for ${component.name}@${component.version}`,
                                p_sbom_version_id: null,
                            })

                            // TODO: Send notification to component owner
                            // This would integrate with your notification system
                            // e.g., send email, Slack message, etc.
                        }
                    }
                }

                scannedProjects++
            } catch (projectError: any) {
                errors.push(`Error scanning project ${project.name}: ${projectError.message}`)
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            stats: {
                projectsScanned: scannedProjects,
                componentsScanned,
                newVulnerabilitiesFound,
            },
            errors: errors.length > 0 ? errors : undefined,
        })

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: "Scan failed",
            details: error.message,
        }, { status: 500 })
    }
}
