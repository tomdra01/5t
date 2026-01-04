"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Container } from "@/components/layout/container"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, TrendingUp } from "lucide-react"
import { VulnerabilityTable } from "@/components/compliance/vulnerability-table"
import { createClient } from "@/utils/supabase/client"
import { useProjectContext } from "@/components/project-context"
import type { Vulnerability } from "@/types"
import type { SbomComponentRow, VulnerabilityRow } from "@/types/db"
import { generateComplianceReport } from "@/app/triage/actions"
import type { ComplianceReportSummary } from "@/types/compliance"

const mapSeverity = (severity?: string | null): Vulnerability["severity"] => {
  switch ((severity || "high").toLowerCase()) {
    case "critical":
      return "critical"
    case "high":
      return "high"
    case "medium":
      return "medium"
    case "low":
      return "low"
    default:
      return "high"
  }
}

const mapStatus = (status?: string | null): Vulnerability["status"] => {
  switch ((status || "open").toLowerCase()) {
    case "reported":
      return "reported"
    case "triaged":
      return "in-remediation"
    case "patched":
      return "resolved"
    case "open":
    default:
      return "discovered"
  }
}

export default function TriagePage() {
  const { projectId } = useProjectContext()
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ComplianceReportSummary | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const loadVulnerabilities = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    if (!projectId) {
      setVulnerabilities([])
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    // Get the latest SBOM version ID first
    const { data: latestVersion } = await supabase
      .from("sbom_versions")
      .select("id")
      .eq("project_id", projectId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single()

    if (!latestVersion) {
      setVulnerabilities([])
      setIsLoading(false)
      return
    }

    const { data: components, error: componentError } = await supabase
      .from("sbom_components")
      .select("id,project_id,name,version,purl,license,author,added_at")
      .eq("project_id", projectId)
      .eq("sbom_version_id", latestVersion.id)

    if (componentError) {
      setError("Unable to load SBOM components for this project.")
      setIsLoading(false)
      return
    }

    const componentRows = components || []
    const componentIds = componentRows.map((component) => component.id)
    if (componentIds.length === 0) {
      setVulnerabilities([])
      setIsLoading(false)
      return
    }

    const { data: vulnRows, error: vulnError } = await supabase
      .from("vulnerabilities")
      .select("id,component_id,cve_id,severity,status,assigned_to,remediation_notes,discovered_at,reporting_deadline,updated_at")
      .in("component_id", componentIds)

    if (vulnError) {
      setError("Unable to load vulnerabilities for this project.")
      setIsLoading(false)
      return
    }

    const componentNameById = new Map(componentRows.map((component) => [component.id, component.name]))
    const mapped = (vulnRows || []).map((row) => {
      const vulnerability = row as VulnerabilityRow
      return {
        id: vulnerability.id,
        cveId: vulnerability.cve_id,
        title: vulnerability.remediation_notes || vulnerability.cve_id,
        severity: mapSeverity(vulnerability.severity),
        cvssScore: 0,
        affectedComponent: componentNameById.get(vulnerability.component_id) || "Unknown",
        discoveredAt: new Date(vulnerability.discovered_at),
        reportingDeadline: new Date(vulnerability.reporting_deadline),
        remediationDeadline: new Date(vulnerability.reporting_deadline),
        status: mapStatus(vulnerability.status),
        ownership: vulnerability.assigned_to ? vulnerability.assigned_to.slice(0, 8) + "…" : "Unassigned",
        remediationStatus: vulnerability.status || "Open",
        description: vulnerability.remediation_notes || undefined,
      } satisfies Vulnerability
    })

    setVulnerabilities(mapped)
    setIsLoading(false)
  }, [projectId])

  useEffect(() => {
    loadVulnerabilities()
  }, [loadVulnerabilities])

  const stats = useMemo(() => {
    const total = vulnerabilities.length
    const activeDeadlines = vulnerabilities.filter((vuln) => vuln.status !== "resolved").length
    const inRemediation = vulnerabilities.filter((vuln) => vuln.status === "in-remediation").length
    const critical = vulnerabilities.filter((vuln) => vuln.severity === "critical").length
    return { total, activeDeadlines, inRemediation, critical }
  }, [vulnerabilities])

  return (
    <Container>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">Vulnerability Triage</h1>
            <p className="text-muted-foreground text-lg">
              Manage discovered vulnerabilities with ownership and remediation tracking for CRA compliance
            </p>
            {!projectId && (
              <p className="text-sm text-muted-foreground">
                Select a project in Organizations to see triage data.
              </p>
            )}
          </div>
          <div className="flex flex-col items-start gap-2">
            <Button
              disabled={!projectId || isGenerating}
              onClick={async () => {
                if (!projectId) return
                setIsGenerating(true)
                const result = await generateComplianceReport({ projectId })
                setReport(result)
                setIsGenerating(false)
              }}
              className="bg-primary text-primary-foreground"
            >
              {isGenerating ? "Generating..." : "Generate Compliance Report"}
            </Button>
            {report && <p className="text-xs text-muted-foreground">{report.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Vulnerabilities</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.activeDeadlines}</p>
                <p className="text-sm text-muted-foreground">Active Deadlines</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inRemediation}</p>
                <p className="text-sm text-muted-foreground">In Remediation</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.critical}</p>
                <p className="text-sm text-muted-foreground">Critical</p>
              </div>
            </div>
          </Card>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {report && report.success && (
          <Card className="border-border bg-card">
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Criticals</p>
                <p className="text-lg font-semibold text-foreground">{report.criticalCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Remediation (hrs)</p>
                <p className="text-lg font-semibold text-foreground">
                  {report.averageRemediationHours || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deadlines Met</p>
                <p className="text-lg font-semibold text-foreground">{report.deadlinesMetPercent}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Vulnerabilities</p>
                <p className="text-lg font-semibold text-foreground">{report.totalVulnerabilities}</p>
              </div>
            </div>
          </Card>
        )}

        {isLoading ? (
          <Card className="border-border bg-card">
            <div className="p-6 text-muted-foreground">Loading vulnerabilities…</div>
          </Card>
        ) : vulnerabilities.length === 0 ? (
          <Card className="border-border bg-card">
            <div className="p-6 text-muted-foreground">
              No vulnerabilities detected. Upload an SBOM in the SBOM Portal to begin tracking.
            </div>
          </Card>
        ) : (
          <VulnerabilityTable vulnerabilities={vulnerabilities} onRefresh={loadVulnerabilities} />
        )}
      </div>
    </Container>
  )
}
