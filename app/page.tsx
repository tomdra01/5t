import { Container } from "@/components/layout/container"
import { BentoGrid } from "@/components/dashboard/bento-grid"
import { DeadlineTimer } from "@/components/dashboard/deadline-timer"
import { mockVulnerabilities, mockDashboardStats } from "@/lib/mock-data"
import { requiresEarlyWarning } from "@/lib/utils/compliance"

export default function DashboardPage() {
  const activeDeadlines = mockVulnerabilities.filter((v) => requiresEarlyWarning(v))

  return (
    <Container>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight text-balance">Triage Center</h1>
          <p className="text-muted-foreground mt-2 text-pretty">
            Real-time compliance monitoring for EU Cyber Resilience Act Article 14 & 15
          </p>
        </div>

        {/* Bento Grid Stats */}
        <BentoGrid stats={mockDashboardStats} />

        {/* Active Deadlines Section */}
        {activeDeadlines.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">Active Early Warning Deadlines</h2>
              <span className="text-sm text-muted-foreground">Live countdown to 24-hour reporting requirement</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeDeadlines.map((vuln) => (
                <DeadlineTimer key={vuln.id} vulnerability={vuln} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}
