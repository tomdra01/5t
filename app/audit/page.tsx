"use client"

import { useEffect, useState } from "react"
import { Container } from "@/components/layout/container"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Calendar, Shield } from "lucide-react"
import { useProjectContext } from "@/components/project-context"
import { fetchComplianceReports, type FetchReportsResult } from "@/app/audit/actions"
import { ComplianceReportList } from "@/components/compliance/compliance-report-list"
import { format } from "date-fns"

export default function AuditPage() {
  const { projectId } = useProjectContext()
  const [data, setData] = useState<FetchReportsResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      const result = await fetchComplianceReports(projectId)
      setData(result)
      setIsLoading(false)
    }

    loadData()
  }, [projectId])

  const stats = {
    totalReports: data?.totalReports ?? 0,
    lastReportDate: data?.lastReportDate
      ? format(data.lastReportDate, "MMM d, yyyy")
      : "No reports",
    status: data?.complianceStatus === "compliant"
      ? "Compliant"
      : data?.complianceStatus === "non_compliant"
        ? "Action Needed"
        : "Unknown",
    statusColor: data?.complianceStatus === "compliant"
      ? "text-emerald-600"
      : "text-muted-foreground"
  }

  return (
    <Container>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">Audit & Reporting Center</h1>
            <p className="text-muted-foreground text-lg">
              Generate audit-ready compliance reports for regulatory submissions
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalReports}</p>
                <p className="text-sm text-muted-foreground">Reports Generated</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.lastReportDate}</p>
                <p className="text-sm text-muted-foreground">Last Report Date</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${stats.statusColor}`}>{stats.status}</p>
                <p className="text-sm text-muted-foreground">Compliance Status</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Report List */}
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading audit data...</div>
        ) : (
          <ComplianceReportList reports={data?.reports ?? []} />
        )}

        {/* Compliance Information */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">CRA Compliance Requirements</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Article 14:</span> Manufacturers must report actively
              exploited vulnerabilities to ENISA within 24 hours of awareness.
            </p>
            <p>
              <span className="font-medium text-foreground">Article 15:</span> Manufacturers must handle vulnerabilities
              in accordance with coordinated vulnerability disclosure practices.
            </p>
            <p>
              <span className="font-medium text-foreground">Annex I:</span> Products with digital elements must maintain
              documentation demonstrating continuous vulnerability management.
            </p>
          </div>
        </Card>
      </div>
    </Container>
  )
}
