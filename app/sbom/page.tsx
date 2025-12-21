"use client"

import { useEffect, useMemo, useState } from "react"
import { Container } from "@/components/layout/container"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Package } from "lucide-react"
import type { SBOMComponent } from "@/types"
import { DropZone } from "@/components/sbom/drop-zone"
import { ComponentTable } from "@/components/sbom/component-table"
import { parseSbomFile } from "@/lib/utils/sbom"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"

export default function SBOMPage() {
  const [components, setComponents] = useState<SBOMComponent[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoadingProjects(true)
      setAuthError(null)
      const supabase = createClient()
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        setAuthError("Sign in to load your projects.")
        setIsLoadingProjects(false)
        return
      }

      const { data, error } = await supabase
        .from("projects")
        .select("id,name")
        .order("created_at", { ascending: false })

      if (error) {
        setUploadError("Failed to load projects.")
        setIsLoadingProjects(false)
        return
      }

      const safeProjects = data ?? []
      setProjects(safeProjects)

      const stored = typeof window !== "undefined" ? window.localStorage.getItem("selectedProjectId") : null
      const storedValid = stored && safeProjects.some((project) => project.id === stored)
      const nextProjectId = storedValid ? stored : safeProjects[0]?.id ?? ""
      if (nextProjectId) {
        setSelectedProjectId(nextProjectId)
        if (typeof window !== "undefined") {
          window.localStorage.setItem("selectedProjectId", nextProjectId)
        }
      }
      setIsLoadingProjects(false)
    }

    loadProjects()
  }, [])

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

      if (!selectedProjectId) {
        setUploadError("Select a project before uploading to Supabase.")
        return
      }

      setIsProcessing(true)
      const response = await fetch("/api/sbom/process", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
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
            <p className="text-sm font-medium text-foreground">Project</p>
            <p className="text-xs text-muted-foreground">Select the project that will receive this SBOM upload.</p>
          </div>
          <div className="md:max-w-md w-full space-y-2">
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(event) => {
                  const value = event.target.value
                  setSelectedProjectId(value)
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem("selectedProjectId", value)
                  }
                }}
                className="w-full appearance-none rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                disabled={isLoadingProjects || projects.length === 0}
              >
                {isLoadingProjects && <option>Loading projects...</option>}
                {!isLoadingProjects && projects.length === 0 && <option>No projects available</option>}
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            {authError ? (
              <p className="text-xs text-destructive">{authError}</p>
            ) : projects.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Create a project in <Link href="/settings" className="underline">Settings</Link> to continue.
              </p>
            ) : null}
          </div>
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
