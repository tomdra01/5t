import { Container } from "@/components/layout/container"
import { VulnerabilityTable } from "@/components/compliance/vulnerability-table"
import { mockVulnerabilities } from "@/lib/mock-data"

export default function TriagePage() {
  return (
    <Container>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight text-balance">Vulnerability Triage</h1>
          <p className="text-muted-foreground mt-2 text-pretty">
            Manage discovered vulnerabilities with ownership and remediation tracking for CRA compliance
          </p>
        </div>

        {/* Vulnerability Table */}
        <VulnerabilityTable vulnerabilities={mockVulnerabilities} />
      </div>
    </Container>
  )
}
