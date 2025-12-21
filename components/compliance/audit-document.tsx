"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { ComplianceReport } from "@/types"

interface AuditDocumentProps {
  report: ComplianceReport
}

export function AuditDocument({ report }: AuditDocumentProps) {
  const resolutionRate = Math.round((report.resolvedVulnerabilities / report.totalVulnerabilities) * 100)

  return (
    <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm max-w-4xl mx-auto">
      <CardHeader className="border-b border-border/50 pb-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground font-bold text-2xl">
              5t
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">CRA Annex I Compliance Report</h1>
          <p className="text-sm text-muted-foreground">EU Cyber Resilience Act - Continuous Vulnerability Management</p>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-8">
        {/* Report Metadata */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground border-b border-border/50 pb-2">Report Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Report ID:</span>
              <span className="font-mono ml-2 font-medium">{report.id}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Generated:</span>
              <span className="ml-2 font-medium">{report.generatedAt.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Period Start:</span>
              <span className="ml-2 font-medium">{report.reportingPeriod.start.toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Period End:</span>
              <span className="ml-2 font-medium">{report.reportingPeriod.end.toLocaleDateString()}</span>
            </div>
          </div>
        </section>

        <Separator />

        {/* Executive Summary */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground border-b border-border/50 pb-2">Executive Summary</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This report demonstrates compliance with the EU Cyber Resilience Act (CRA) Articles 14 and 15, providing
            evidence of continuous vulnerability management and timely early warning notifications for actively
            exploited vulnerabilities.
          </p>
          <div className="grid grid-cols-3 gap-4 p-6 bg-muted/20 rounded-2xl">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{resolutionRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">Resolution Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{report.earlyWarningReports}</div>
              <div className="text-xs text-muted-foreground mt-1">Early Warnings Issued</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{report.complianceScore}</div>
              <div className="text-xs text-muted-foreground mt-1">Compliance Score</div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Vulnerability Statistics */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground border-b border-border/50 pb-2">
            Vulnerability Statistics
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
              <span className="text-muted-foreground">Total Vulnerabilities Identified:</span>
              <span className="font-semibold text-foreground">{report.totalVulnerabilities}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
              <span className="text-muted-foreground">Successfully Resolved:</span>
              <span className="font-semibold text-green-600">{report.resolvedVulnerabilities}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
              <span className="text-muted-foreground">Currently Active:</span>
              <span className="font-semibold text-primary">{report.activeVulnerabilities}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
              <span className="text-muted-foreground">Critical Severity:</span>
              <span className="font-semibold text-destructive">{report.criticalCount}</span>
            </div>
          </div>
        </section>

        <Separator />

        {/* Remediation Efforts */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground border-b border-border/50 pb-2">Remediation Efforts</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The following actions demonstrate our continuous commitment to vulnerability management and remediation:
          </p>
          <div className="space-y-3">
            {report.remediationEfforts.map((effort, index) => (
              <div key={effort.vulnerabilityId} className="p-4 bg-muted/20 rounded-xl space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {effort.vulnerabilityId}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(effort.takenAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">{effort.action}</p>
                    <p className="text-xs text-muted-foreground">{effort.outcome}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* Compliance Statement */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground border-b border-border/50 pb-2">Compliance Statement</h2>
          <div className="p-6 bg-primary/5 border-2 border-primary/20 rounded-2xl space-y-3">
            <p className="text-sm leading-relaxed">
              <strong className="text-foreground">CRA Article 14 (Early Warning):</strong>
              <span className="text-muted-foreground ml-2">
                We have issued {report.earlyWarningReports} early warning reports within the required 24-hour timeframe
                for actively exploited vulnerabilities with CVSS scores ≥9.0.
              </span>
            </p>
            <p className="text-sm leading-relaxed">
              <strong className="text-foreground">CRA Article 15 (Vulnerability Management):</strong>
              <span className="text-muted-foreground ml-2">
                Our continuous vulnerability management process includes discovery, assessment, ownership assignment,
                remediation tracking, and documented resolution efforts as evidenced in this report.
              </span>
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            This report is generated in compliance with EU Cyber Resilience Act requirements
          </p>
          <p className="text-xs text-muted-foreground mt-1">5teen.app - Professional CRA Compliance Dashboard</p>
        </div>
      </CardContent>
    </Card>
  )
}
