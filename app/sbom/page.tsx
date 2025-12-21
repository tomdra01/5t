"use client"

import { useMemo, useState } from "react"
import { Container } from "@/components/layout/container"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Package } from "lucide-react"
import type { SBOMComponent } from "@/types"
import { DropZone } from "@/components/sbom/drop-zone"
import { ComponentTable } from "@/components/sbom/component-table"
import { parseSbomFile } from "@/lib/utils/sbom"

export default function SBOMPage() {
  const [components, setComponents] = useState<SBOMComponent[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [projectId, setProjectId] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const stats = useMemo(() => {
    const totalComponents = components.length
    const vulnerableComponents = components.filter((component) => component.vulnerabilities > 0).length
    const totalVulnerabilities = components.reduce((sum, component) => sum + component.vulnerabilities, 0)

    return { totalComponents, vulnerableComponents, totalVulnerabilities }
  }, [components])

  const handleFileUpload = async (file: File) => {
    try {
      setUploadError(null)
      const parsed = await parseSbomFile(file)
      setComponents(parsed.components)

      if (!projectId.trim()) {
        setUploadError("Add a Project ID before uploading to Supabase.")
        return
      }

      setIsProcessing(true)
      const response = await fetch("/api/sbom/process", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId: projectId.trim(),
          components: parsed.components,
        }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { message?: string }
        setUploadError(data.message || "Failed to save SBOM data.")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to parse SBOM file."
      setUploadError(message)
      setComponents([])
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Container className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">CRA Compliance</p>
        <h1 className="text-4xl md:text-5xl font-semibold text-foreground tracking-tight">SBOM Portal</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Upload CycloneDX or SPDX files to surface component inventory, highlight vulnerable packages, and keep CRA
          evidence audit-ready.
        </p>
      </div>

      {/* Project Selector */}
      <Card className="border-border/60 bg-card/70">
        <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Supabase Project ID</p>
            <p className="text-xs text-muted-foreground">Paste the project UUID to link this upload.</p>
          </div>
          <Input
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            placeholder="e.g. 0f2a6c2f-8e23-4a9f-bcdf-47f2b3f2e1ab"
            className="md:max-w-md"
          />
        </div>
      </Card>

      {/* Upload Zone */}
      <DropZone onFileUpload={handleFileUpload} />
      {uploadError && (
        <div className="text-sm text-destructive border border-destructive/20 bg-destructive/5 rounded-2xl px-4 py-3">
          {uploadError}
        </div>
      )}
      {isProcessing && <p className="text-sm text-muted-foreground">Scanning and saving to Supabase...</p>}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-border/60 bg-card/70">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalComponents}</p>
              <p className="text-sm text-muted-foreground">Total Components</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border/60 bg-card/70">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.vulnerableComponents}</p>
              <p className="text-sm text-muted-foreground">Vulnerable Components</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border/60 bg-card/70">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalVulnerabilities}</p>
              <p className="text-sm text-muted-foreground">Total Vulnerabilities</p>
            </div>
          </div>
        </Card>
      </div>

      {components.length > 0 ? (
        <ComponentTable components={components} />
      ) : (
        <Card className="border-border/60 bg-card/70">
          <div className="p-6 text-center text-muted-foreground">
            No components uploaded yet. Upload an SBOM file to get started.
          </div>
        </Card>
      )}
    </Container>
  )
}
