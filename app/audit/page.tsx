"use client"

import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { ReportSummary } from "@/components/compliance/report-summary"
import { RemediationTimeline } from "@/components/compliance/remediation-timeline"
import { AuditDocument } from "@/components/compliance/audit-document"
import { mockComplianceReport } from "@/lib/mock-data"
import { Download, FileText } from "lucide-react"

export default function AuditPage() {
  const handleGenerateReport = () => {
    console.log("[v0] Generating CRA Annex I Report...")
    // In a real app, this would generate a PDF or JSON export
    window.print()
  }

  const handleExportJSON = () => {
    console.log("[v0] Exporting report as JSON...")
    const dataStr = JSON.stringify(mockComplianceReport, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `cra-compliance-report-${mockComplianceReport.id}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  return (
    <Container className="max-w-7xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight text-balance">Audit & Reporting Center</h1>
            <p className="text-muted-foreground mt-2 text-pretty">
              Generate audit-ready compliance reports for regulatory submissions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleExportJSON} variant="outline" className="rounded-2xl gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            <Button onClick={handleGenerateReport} className="rounded-2xl gap-2 bg-primary text-primary-foreground">
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <ReportSummary report={mockComplianceReport} />

        {/* Remediation Timeline */}
        <RemediationTimeline efforts={mockComplianceReport.remediationEfforts} />

        {/* Audit Document */}
        <div className="print:p-0">
          <AuditDocument report={mockComplianceReport} />
        </div>
      </div>
    </Container>
  )
}
