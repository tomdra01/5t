"use client"

import { useState } from "react"
import { Container } from "@/components/layout/container"
import { DropZone } from "@/components/sbom/drop-zone"
import { ComponentTable } from "@/components/sbom/component-table"
import { mockSBOMComponents } from "@/lib/mock-data"
import { Card, CardContent } from "@/components/ui/card"
import { Package, Shield, AlertTriangle } from "lucide-react"

export default function SBOMPage() {
  const [components] = useState(mockSBOMComponents)

  const handleFileUpload = (file: File) => {
    console.log("[v0] SBOM file uploaded:", file.name)
    // In a real app, parse the SBOM file and update the components state
  }

  const totalComponents = components.length
  const vulnerableComponents = components.filter((c) => c.vulnerabilities > 0).length
  const totalVulnerabilities = components.reduce((sum, c) => sum + c.vulnerabilities, 0)

  return (
    <Container>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight text-balance">SBOM Portal</h1>
          <p className="text-muted-foreground mt-2 text-pretty">
            Software Bill of Materials management and vulnerability tracking
          </p>
        </div>

        {/* Upload Zone */}
        <DropZone onFileUpload={handleFileUpload} />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Components</p>
                  <p className="text-2xl font-bold">{totalComponents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vulnerable</p>
                  <p className="text-2xl font-bold">{vulnerableComponents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-600">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Vulnerabilities</p>
                  <p className="text-2xl font-bold">{totalVulnerabilities}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Component Table */}
        <ComponentTable components={components} />
      </div>
    </Container>
  )
}
