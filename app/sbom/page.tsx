"use client"

import { useEffect, useMemo, useState } from "react"
import { Container } from "@/components/layout/container"
import { Card } from "@/components/ui/card"
import { AlertTriangle, Package } from "lucide-react"
import type { SBOMComponent } from "@/types"
import { DropZone } from "@/components/sbom/drop-zone"
import { ComponentTable } from "@/components/sbom/component-table"
import { parseSbomFile } from "@/lib/utils/sbom"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { uploadSbomAction } from "@/app/sbom/actions"
import { useProjectContext } from "@/components/project-context"
import { toast } from "sonner"

export default function SBOMPage() {
  const [components, setComponents] = useState<SBOMComponent[]>([])
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const { projectId, setProjectId } = useProjectContext()

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
        toast.error("Failed to load projects.")
        setIsLoadingProjects(false)
        return
      }

      const safeProjects = data || []
      setProjects(safeProjects)

      const stored = typeof window !== "undefined" ? window.localStorage.getItem("selectedProjectId") : null
      const storedValid = stored && safeProjects.some((project) => project.id === stored)
      const nextProjectId = storedValid ? stored : projectId || safeProjects[0]?.id
      if (nextProjectId) {
        setProjectId(nextProjectId)
      }
      setIsLoadingProjects(false)
    }

    loadProjects()
  }, [])

  useEffect(() => {
    const loadComponents = async () => {
      if (!projectId) {
        setComponents([])
        return
      }

      const supabase = createClient()

      // Get the latest SBOM version ID first
      const { data: latestVersion } = await supabase
        .from("sbom_versions")
        .select("id")
        .eq("project_id", projectId)
        .order("version_number", { ascending: false })
        .limit(1)
        .single()

      if (!latestVersion) {
        setComponents([])
        return
      }

      // Fetch components only for the latest version
      const { data: componentRows, error: componentError } = await supabase
        .from("sbom_components")
        .select("id,name,version,license,purl,author,added_at")
        .eq("project_id", projectId)
        .eq("sbom_version_id", latestVersion.id)
        .order("name", { ascending: true })

      if (componentError) {
        toast.error("Failed to load SBOM components.")
        return
      }

      const componentIds = (componentRows || []).map((component) => component.id)
      const { data: vulnRows } = componentIds.length
        ? await supabase.from("vulnerabilities").select("component_id").in("component_id", componentIds)
        : { data: [] }

      const vulnCounts = new Map<string, number>()
      ;(vulnRows || []).forEach((row) => {
        vulnCounts.set(row.component_id, (vulnCounts.get(row.component_id) || 0) + 1)
      })

      const mapped = (componentRows || []).map((component) => ({
        id: component.id,
        name: component.name || "Unknown",
        version: component.version || "Unknown",
        type: "library" as const,
        license: component.license || undefined,
        purl: component.purl || undefined,
        author: component.author || undefined,
        vulnerabilities: vulnCounts.get(component.id) || 0,
        lastUpdated: new Date(component.added_at || new Date().toISOString()),
      }))

      setComponents(mapped)
    }

    loadComponents()
  }, [projectId])

  const stats = useMemo(() => {
    const totalComponents = components.length
    const vulnerableComponents = components.filter((component) => component.vulnerabilities > 0).length
    const totalVulnerabilities = components.reduce((sum, component) => sum + component.vulnerabilities, 0)

    return { totalComponents, vulnerableComponents, totalVulnerabilities }
  }, [components])

  const handleFileUpload = async (file: File) => {
    try {
      const parsed = await parseSbomFile(file)
      setComponents(parsed.components)

      if (!projectId) {
        toast.error("Please select a project before uploading.")
        return
      }

      setIsProcessing(true)

      // Read file content as string for the action
      const fileContent = await file.text()
      const result = await uploadSbomAction({ projectId, fileContent })

      if (!result.success) {
        toast.error(result.message || "Failed to save SBOM data.")
      } else {
        toast.success(result.message)
        // Refresh data to show new vulnerabilities
        // We need to trigger the loadComponents effect
        // A simple way is to force a reload by re-fetching project data
        // or just calling a refresh function if we extract it

        // Let's re-trigger the project ID change effect or just reload
        // Since loadComponents depends on projectId, we can just call it if we extract it,
        // but for now let's just use router.refresh() if we had it, or reload window
        // Better: trigger a re-fetch manually

        // Re-fetch components to get vulnerability counts from DB
        const supabase = createClient()

        // Get the latest SBOM version ID first
        const { data: latestVersion } = await supabase
          .from("sbom_versions")
          .select("id")
          .eq("project_id", projectId)
          .order("version_number", { ascending: false })
          .limit(1)
          .single()

        if (!latestVersion) return

        const { data: componentRows } = await supabase
          .from("sbom_components")
          .select("id,name,version,license,purl,author,added_at")
          .eq("project_id", projectId)
          .eq("sbom_version_id", latestVersion.id)
          .order("name", { ascending: true })

        if (componentRows) {
          const componentIds = componentRows.map(c => c.id)
          const { data: vulnRows } = componentIds.length
            ? await supabase.from("vulnerabilities").select("component_id").in("component_id", componentIds)
            : { data: [] }

          const vulnCounts = new Map<string, number>()
          ;(vulnRows || []).forEach((row) => {
            vulnCounts.set(row.component_id, (vulnCounts.get(row.component_id) || 0) + 1)
          })

          const mapped = componentRows.map((component) => ({
            id: component.id,
            name: component.name || "Unknown",
            version: component.version || "Unknown",
            type: "library" as const,
            license: component.license || undefined,
            purl: component.purl || undefined,
            author: component.author || undefined,
            vulnerabilities: vulnCounts.get(component.id) || 0,
            lastUpdated: new Date(component.added_at || new Date().toISOString()),
          }))

          setComponents(mapped)
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to parse SBOM file."
      toast.error(message, {
        icon: <AlertTriangle className="h-4 w-4" />,
      })
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
                value={projectId}
                onChange={(event) => {
                  const value = event.target.value
                  setProjectId(value)
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
