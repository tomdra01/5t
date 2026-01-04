"use client"

import { useEffect, useMemo, useState } from "react"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, AlertTriangle, Package, FileText, TrendingUp, BarChart3, Clock, FileDown } from "lucide-react"
import Link from "next/link"
import { useProjectContext } from "@/components/project-context"
import { createClient } from "@/utils/supabase/client"
import type { ComplianceReportRow, SbomComponentRow, VulnerabilityRow } from "@/types/db"
import { RadialComplianceChart } from "@/components/charts/radial-compliance-chart"
import { VulnerabilityTrendChart } from "@/components/charts/vulnerability-trend-chart"
import { SeverityDistributionChart } from "@/components/charts/severity-distribution-chart"
import { RemediationTimeChart } from "@/components/charts/remediation-time-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"

import { generateComplianceReport } from "@/app/triage/actions"
import { calculateRemediationStats } from "@/lib/metrics"
import { toast } from "sonner"

interface ActivityItem {
  id: string
  type: "sbom" | "report"
  createdAt: string
  label: string
}

const mapStatus = (status?: string | null): string => {
  switch ((status || "open").toLowerCase()) {
    case "reported":
      return "Reported"
    case "triaged":
      return "In Remediation"
    case "patched":
      return "Resolved"
    case "ignored":
      return "Ignored"
    case "open":
    default:
      return "Discovered"
  }
}

export default function DashboardPage() {
  const { projectId } = useProjectContext()
  const [components, setComponents] = useState<SbomComponentRow[]>([])
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityRow[]>([])
  const [reports, setReports] = useState<ComplianceReportRow[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportMessage, setReportMessage] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const loadDashboard = async () => {
      setIsLoading(true)
      setError(null)
      setReportMessage(null)

      if (!projectId) {
        setComponents([])
        setVulnerabilities([])
        setReports([])
        setActivity([])
        setIsLoading(false)
        return
      }

      const { data: componentsData, error: componentError } = await supabase
        .from("sbom_components")
        .select("id,project_id,name,version,purl,license,author,added_at,sbom_version_id,previous_version")
        .eq("project_id", projectId)
        .order("added_at", { ascending: false })

      if (componentError) {
        setError("Unable to load SBOM components for this project.")
        setIsLoading(false)
        return
      }

      const componentRows = componentsData || []
      setComponents(componentRows)

      // Auto-ignore past-deadline vulnerabilities before loading
      if (projectId) {
        const { autoIgnorePastDeadlineAction } = await import("@/app/triage/actions")
        await autoIgnorePastDeadlineAction({ projectId })
      }

      const componentIds = componentRows.map((component) => component.id)
      if (componentIds.length > 0) {
        const { data: vulnRows, error: vulnError } = await supabase
          .from("vulnerabilities")
          .select("id,component_id,cve_id,severity,status,assigned_to,remediation_notes,discovered_at,reporting_deadline,updated_at")
          .in("component_id", componentIds)

        if (vulnError) {
          setError("Unable to load vulnerabilities for this project.")
        } else {
          setVulnerabilities(vulnRows || [])
        }
      }

      const { data: reportRows, error: reportError } = await supabase
        .from("compliance_reports")
        .select("id,project_id,report_type,generated_by,sent_to_regulator,created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(5)

      if (reportError) {
        setError("Unable to load compliance reports for this project.")
      } else {
        setReports(reportRows || [])
      }

      const sbomActivity = componentRows.slice(0, 3).map((component) => ({
        id: `sbom-${component.id}`,
        type: "sbom" as const,
        createdAt: component.added_at,
        label: `SBOM component added: ${component.name}`,
      }))

      const reportActivity = (reportRows || []).map((report) => ({
        id: `report-${report.id}`,
        type: "report" as const,
        createdAt: report.created_at,
        label: `Report generated: ${report.report_type || "Compliance"}`,
      }))

      const combined = [...sbomActivity, ...reportActivity].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )

      setActivity(combined.slice(0, 6))
      setIsLoading(false)
    }

    loadDashboard()

    let refreshTimeout: NodeJS.Timeout

    const debouncedRefresh = () => {
      clearTimeout(refreshTimeout)
      refreshTimeout = setTimeout(loadDashboard, 2000)
    }

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vulnerabilities" },
        () => {
          toast.info("New vulnerabilities detected. Updating dashboard...", {
            duration: 3000,
            icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
            id: "vuln-update",
          })
          debouncedRefresh()
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sbom_components" },
        () => {
          toast.success("SBOM component processed.", {
            duration: 3000,
            icon: <Package className="h-4 w-4 text-green-500" />,
            id: "sbom-update",
          })
          debouncedRefresh()
        }
      )
      .subscribe()

    return () => {
      clearTimeout(refreshTimeout)
      supabase.removeChannel(channel)
    }
  }, [projectId])

  const overdueCount = useMemo(() => {
    const now = new Date()
    return vulnerabilities.filter((vuln) => new Date(vuln.reporting_deadline) < now).length
  }, [vulnerabilities])

  const vulnerableComponents = useMemo(() => {
    const componentIds = new Set(vulnerabilities.map((v) => v.component_id))
    return componentIds.size
  }, [vulnerabilities])

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-lg">EU Cyber Resilience Act Compliance Management</p>
          {isLoading && <p className="text-xs text-muted-foreground">Loading project data…</p>}
        </div>

        {!projectId && (
          <Card className="border-border/60 bg-card/70 p-6">
            <p className="text-sm text-muted-foreground">Select a project to view dashboard metrics.</p>
          </Card>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* View Modes */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6 border-border/60 bg-card/70">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{components.length}</p>
                    <p className="text-sm text-muted-foreground">Components</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-border/60 bg-card/70">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{vulnerabilities.length}</p>
                    <p className="text-sm text-muted-foreground">Vulnerabilities</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-border/60 bg-card/70">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{overdueCount}</p>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-border/60 bg-card/70">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{reports.length}</p>
                    <p className="text-sm text-muted-foreground">Reports</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Compliance Chart */}
              <div className="lg:col-span-1">
                <RadialComplianceChart
                  totalVulnerabilities={vulnerabilities.length}
                  overdueDeadlines={overdueCount}
                />
              </div>

              {/* Recent Activity */}
              <Card className="lg:col-span-2 border-border/60 bg-card/70">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
                  <CardDescription>Latest SBOM uploads and compliance reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentActivity items={activity} />
                </CardContent>
              </Card>
            </div>

            {/* Upload Section */}
            <Card className="border-border/60 bg-card/70">
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">Upload SBOM</h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  Upload your Software Bill of Materials to track compliance. Supports SPDX and CycloneDX formats.
                </p>
                <Link href="/sbom">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Upload SBOM</Button>
                </Link>
              </div>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VulnerabilityTrendChart vulnerabilities={vulnerabilities} />
              <SeverityDistributionChart vulnerabilities={vulnerabilities} />
              <div className="lg:col-span-2">
                <RemediationTimeChart vulnerabilities={vulnerabilities} />
              </div>
            </div>


            {/* Additional Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 border-border/60 bg-card/70">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Vulnerable Components</p>
                  <p className="text-3xl font-bold">{vulnerableComponents}</p>
                  <p className="text-xs text-muted-foreground">
                    {((vulnerableComponents / Math.max(components.length, 1)) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </Card>

              <Card className="p-6 border-border/60 bg-card/70">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Average Time to Patch</p>
                  <p className="text-3xl font-bold">
                    {calculateRemediationStats(vulnerabilities).averageRemediationHours !== null
                      ? `${calculateRemediationStats(vulnerabilities).averageRemediationHours}h`
                      : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {vulnerabilities.filter(v => ["Patched", "resolved"].includes(v.status || "")).length} resolved
                  </p>
                </div>
              </Card>

              <Card className="p-6 border-border/60 bg-card/70">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                  <p className="text-3xl font-bold">
                    {calculateRemediationStats(vulnerabilities).deadlinesMetPercent}%
                  </p>
                  <p className="text-xs text-muted-foreground">Based on deadlines</p>
                </div>
              </Card>

            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6 mt-6">
            <Card className="border-border/60 bg-card/70">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Vulnerability Timeline</CardTitle>
                <CardDescription>Track vulnerability discovery and resolution over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {vulnerabilities.length > 0 && (
                    <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-border" />
                  )}
                  <div className="space-y-6">
                    {vulnerabilities
                      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                      .slice(0, 10)
                      .map((vuln) => (
                        <div key={vuln.id} className="relative pl-8">
                          <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-2 ${
                            vuln.status?.toLowerCase() === "patched" ? "bg-green-500 border-green-600" :
                            vuln.status?.toLowerCase() === "triaged" ? "bg-blue-500 border-blue-600" :
                            vuln.status?.toLowerCase() === "ignored" ? "bg-gray-500 border-gray-600" :
                              "bg-orange-500 border-orange-600"
                          }`} />
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-foreground">{vuln.cve_id}</p>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                vuln.status?.toLowerCase() === "patched" ? "bg-green-500/10 text-green-600" :
                                vuln.status?.toLowerCase() === "triaged" ? "bg-blue-500/10 text-blue-600" :
                                vuln.status?.toLowerCase() === "ignored" ? "bg-gray-500/10 text-gray-600" :
                                  "bg-orange-500/10 text-orange-600"
                              }`}>
                                {mapStatus(vuln.status)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className={`px-2 py-0.5 text-xs rounded ${
                                vuln.severity === "Critical" ? "bg-red-500/10 text-red-600" :
                                vuln.severity === "High" ? "bg-orange-500/10 text-orange-600" :
                                vuln.severity === "Medium" ? "bg-yellow-500/10 text-yellow-600" :
                                  "bg-blue-500/10 text-blue-600"
                              }`}>
                                {vuln.severity}
                              </span>
                              <span>•</span>
                              <span>Updated {new Date(vuln.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  {vulnerabilities.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No vulnerabilities yet</p>
                  )}
                </div>
                {vulnerabilities.length > 10 && (
                  <div className="text-center pt-6 border-t mt-6">
                    <Link href="/triage">
                      <Button variant="outline">View All Vulnerabilities</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6 mt-6">
            <Card className="border-border/60 bg-card/70">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">CRA Compliance Reports</CardTitle>
                <CardDescription>Generate audit-ready compliance documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Generate Compliance Report</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create regulator-ready documentation with vulnerability summaries and CRA Article 14/15 compliance status.
                      </p>
                      <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={!projectId || isGenerating}
                        onClick={async () => {
                          if (!projectId) return
                          setIsGenerating(true)
                          const result = await generateComplianceReport({ projectId })
                          setReportMessage(result.message)
                          setIsGenerating(false)
                          toast.success("Report generated successfully")
                        }}
                      >
                        {isGenerating ? "Generating..." : "Generate Report"}
                      </Button>
                      {reportMessage && <p className="text-xs text-muted-foreground mt-3">{reportMessage}</p>}
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <FileDown className="h-7 w-7 text-primary" />
                    </div>
                  </div>

                  {reports.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-3">Recent Reports</h4>
                      <div className="space-y-2">
                        {reports.map((report) => (
                          <div key={report.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{report.report_type || "Compliance Report"}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(report.created_at).toLocaleString()}
                              </p>
                            </div>
                            <Link href={`/reports/${report.id}/print`} target="_blank">
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4 mr-2" />
                                View Report
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  )
}
