import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertTriangle, Clock, Shield } from "lucide-react"
import type { ComplianceReport } from "@/types"

interface ReportSummaryProps {
  report: ComplianceReport
}

export function ReportSummary({ report }: ReportSummaryProps) {
  const resolutionRate = Math.round((report.resolvedVulnerabilities / report.totalVulnerabilities) * 100)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Vulnerabilities</p>
              <p className="text-2xl font-bold">{report.totalVulnerabilities}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold">{report.resolvedVulnerabilities}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{report.activeVulnerabilities}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold">{report.criticalCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
