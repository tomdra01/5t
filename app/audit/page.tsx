import { Container } from "@/components/layout/container"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Calendar, Shield } from "lucide-react"

export default function AuditPage() {
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

          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Summary Cards - Empty State */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Reports Generated</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">-</p>
                <p className="text-sm text-muted-foreground">Last Report Date</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">-</p>
                <p className="text-sm text-muted-foreground">Compliance Status</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Report Preview - Empty State */}
        <Card className="border-border bg-card">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">No Reports Generated</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Upload SBOM data and manage vulnerabilities to generate comprehensive CRA Annex I compliance reports for
              regulatory submissions.
            </p>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Generate First Report</Button>
          </div>
        </Card>

        {/* Compliance Information */}
        <Card className="border-border bg-card p-6">
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
