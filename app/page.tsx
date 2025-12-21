"use client"

import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import { Upload, AlertTriangle, Package, FileText, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 border-border/60 bg-card/70">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">0</p>
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
                  <p className="text-2xl font-bold text-foreground">0</p>
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
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border/60 bg-card/70">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">Reports</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="border-border/60 bg-card/70">
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Get Started with SBOM Upload</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Upload your Software Bill of Materials (SBOM) to begin tracking compliance with CRA requirements.
                Supports SPDX and CycloneDX formats.
              </p>
              <Link href="/sbom">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Upload SBOM</Button>
              </Link>
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: "workflows",
      label: "Workflows",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/triage">
            <Card className="p-6 border-border/60 bg-card/70 hover:border-primary/50 transition-colors cursor-pointer">
              <AlertTriangle className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Vulnerability Triage</h3>
              <p className="text-sm text-muted-foreground">
                Manage and track vulnerabilities with 24-hour reporting deadlines
              </p>
            </Card>
          </Link>

          <Link href="/audit">
            <Card className="p-6 border-border/60 bg-card/70 hover:border-primary/50 transition-colors cursor-pointer">
              <FileText className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Audit Reports</h3>
              <p className="text-sm text-muted-foreground">
                Generate CRA Annex I compliance documentation for regulators
              </p>
            </Card>
          </Link>

          <Link href="/settings">
            <Card className="p-6 border-border/60 bg-card/70 hover:border-primary/50 transition-colors cursor-pointer">
              <Package className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Configuration</h3>
              <p className="text-sm text-muted-foreground">Set up integrations and customize compliance workflows</p>
            </Card>
          </Link>
        </div>
      ),
    },
    {
      id: "reporting",
      label: "Reporting",
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-6 border-border/60 bg-card/70 lg:col-span-2">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Audit-ready reporting</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-xl">
                  Generate regulator-ready PDFs and JSON summaries once your SBOM and vulnerability data are in place.
                  Keep evidence, ownership, and remediation milestones aligned to CRA Articles 14 and 15.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/audit">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Generate report</Button>
                  </Link>
                  <Link href="/triage">
                    <Button variant="outline">Review triage</Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:flex h-14 w-14 rounded-2xl bg-primary/10 items-center justify-center text-primary">
                <FileText className="h-7 w-7" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/60 bg-card/70">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SBOM Intake</p>
                <p className="text-lg font-semibold text-foreground">Upload latest inventory</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Keep component inventories current to surface vulnerabilities faster and strengthen evidence trails.
            </p>
            <Link href="/sbom">
              <Button variant="outline" className="w-full">
                Upload SBOM
              </Button>
            </Link>
          </Card>
        </div>
      ),
    },
  ]

  return (
    <Container>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">CRA Compliance Dashboard</h1>
          <p className="text-muted-foreground text-lg">EU Cyber Resilience Act Article 14 & 15 Management</p>
        </div>

        <DashboardTabs tabs={tabs} initialTabId="overview" />
      </div>
    </Container>
  )
}
