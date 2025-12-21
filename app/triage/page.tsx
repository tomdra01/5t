import { Container } from "@/components/layout/container"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Search, Filter, Clock, TrendingUp } from "lucide-react"

export default function TriagePage() {
  return (
    <Container>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Vulnerability Triage</h1>
          <p className="text-muted-foreground text-lg">
            Manage discovered vulnerabilities with ownership and remediation tracking for CRA compliance
          </p>
        </div>

        {/* Quick Stats - Empty State */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
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
                <p className="text-2xl font-bold text-foreground">0</p>
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
                <p className="text-2xl font-bold text-foreground">0</p>
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
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Critical</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Vulnerability Table - Empty State */}
        <Card className="border-border bg-card">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Active Vulnerabilities</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search CVE IDs..." className="pl-9 w-64" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">CVE ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Severity</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">CVSS</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Component</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Owner</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      No vulnerabilities detected. Upload an SBOM in the SBOM Portal to begin tracking.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  )
}
