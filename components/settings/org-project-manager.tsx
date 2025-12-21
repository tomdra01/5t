"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"

interface Organization {
  id: string
  name: string
  owner_id: string | null
}

interface Project {
  id: string
  name: string
  organization_id: string | null
}

export function OrgProjectManager() {
  const supabase = useMemo(() => createClient(), [])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState("")
  const selectedOrgIdRef = useRef("")
  const [orgName, setOrgName] = useState("")
  const [projectName, setProjectName] = useState("")
  const [memberUserId, setMemberUserId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [orgLoadError, setOrgLoadError] = useState<string | null>(null)
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const loadData = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true)
    }
    setError(null)
    setStatus(null)
    setOrgLoadError(null)
    setProjectLoadError(null)
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      setError("Sign in to manage organizations and projects.")
      setIsLoading(false)
      return
    }
    setCurrentUserId(userData.user.id)

    const [orgResult, projectResult] = await Promise.all([
      supabase.from("organizations").select("id,name,owner_id").order("created_at", { ascending: false }),
      supabase.from("projects").select("id,name,organization_id").order("created_at", { ascending: false }),
    ])

    if (orgResult.error) {
      setOrgLoadError(`Unable to load organizations: ${orgResult.error.message}`)
    }
    if (projectResult.error) {
      setProjectLoadError(`Unable to load projects: ${projectResult.error.message}`)
    }

    const orgs = orgResult.data ?? []
    if (!orgResult.error) {
      setOrganizations(orgs)
      const activeSelection = selectedOrgIdRef.current
      if (orgs.length === 0) {
        if (activeSelection) {
          setSelectedOrgId("")
        }
      } else if (!activeSelection || !orgs.some((org) => org.id === activeSelection)) {
        setSelectedOrgId(orgs[0].id)
      }
    }
    if (!projectResult.error) {
      setProjects(projectResult.data ?? [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    selectedOrgIdRef.current = selectedOrgId
  }, [selectedOrgId])

  useEffect(() => {
    const handleChange = () => {
      loadData(false)
    }

    const channel = supabase
      .channel("org-project-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "organizations" }, handleChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "organization_members" }, handleChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, handleChange)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleCreateOrg = async () => {
    setError(null)
    setStatus(null)
    if (!orgName.trim()) {
      setError("Organization name is required.")
      return
    }

    const ownerId = currentUserId ?? (await supabase.auth.getUser()).data.user?.id
    if (!ownerId) {
      setError("Sign in to create an organization.")
      return
    }

    const { data: orgData, error: insertError } = await supabase
      .from("organizations")
      .insert({ name: orgName.trim() })
      .select("id")
      .single()

    if (insertError || !orgData) {
      setError(`Unable to create organization: ${insertError?.message ?? "Unknown error"}`)
      return
    }

    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({ organization_id: orgData.id, user_id: ownerId, role: "owner" })

    if (memberError) {
      setError(`Organization created, but failed to add owner: ${memberError.message}`)
      return
    }

    setOrgName("")
    setStatus("Organization created.")
    setOrganizations((prev) => [{ id: orgData.id, name: orgName.trim(), owner_id: ownerId }, ...prev])
    setSelectedOrgId(orgData.id)
    loadData()
  }

  const handleInviteMember = async () => {
    setError(null)
    setStatus(null)
    if (!selectedOrgId) {
      setError("Select an organization first.")
      return
    }

    if (!memberUserId.trim()) {
      setError("User ID is required.")
      return
    }

    const { error: insertError } = await supabase
      .from("organization_members")
      .insert({ organization_id: selectedOrgId, user_id: memberUserId.trim(), role: "member" })

    if (insertError) {
      setError(`Unable to add member: ${insertError.message}`)
      return
    }

    setMemberUserId("")
    setStatus("Member added.")
  }

  const handleCreateProject = async () => {
    setError(null)
    setStatus(null)
    if (!selectedOrgId) {
      setError("Select an organization first.")
      return
    }

    if (!projectName.trim()) {
      setError("Project name is required.")
      return
    }

    const ownerId = currentUserId ?? (await supabase.auth.getUser()).data.user?.id
    if (!ownerId) {
      setError("Sign in to create a project.")
      return
    }
    const { error: insertError } = await supabase
      .from("projects")
      .insert({ name: projectName.trim(), organization_id: selectedOrgId, user_id: ownerId })

    if (insertError) {
      setError(`Unable to create project: ${insertError.message}`)
      return
    }

    setProjectName("")
    setStatus("Project created.")
    loadData()
  }

  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Organizations & Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading organization data…</p>
        ) : (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Active Organization</Label>
              <div className="relative">
                <select
                  value={selectedOrgId}
                  onChange={(event) => setSelectedOrgId(event.target.value)}
                  className="w-full appearance-none rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  disabled={organizations.length === 0}
                >
                  {organizations.length === 0 && <option>No organizations found</option>}
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org-name" className="text-sm font-medium">
                  New Organization
                </Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(event) => setOrgName(event.target.value)}
                  placeholder="Acme Security"
                />
                <Button onClick={handleCreateOrg} className="w-full bg-primary text-primary-foreground">
                  Create Organization
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-name" className="text-sm font-medium">
                  New Project
                </Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="CRA Compliance Portal"
                />
                <Button onClick={handleCreateProject} className="w-full" variant="outline">
                  Create Project
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-id" className="text-sm font-medium">
                  Invite User (by ID)
                </Label>
                <Input
                  id="member-id"
                  value={memberUserId}
                  onChange={(event) => setMemberUserId(event.target.value)}
                  placeholder="User UUID"
                />
                <Button onClick={handleInviteMember} className="w-full" variant="outline">
                  Add Member
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/60 p-4">
                <p className="text-sm font-medium text-foreground mb-2">Projects in Organization</p>
                {projects.filter((project) => project.organization_id === selectedOrgId).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No projects yet.</p>
                ) : (
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {projects
                      .filter((project) => project.organization_id === selectedOrgId)
                      .map((project) => (
                        <li key={project.id} className="flex items-center justify-between">
                          <span className="text-foreground">{project.name}</span>
                          <span className="text-xs text-muted-foreground">{project.id.slice(0, 8)}…</span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-border/60 p-4">
                <p className="text-sm font-medium text-foreground mb-2">Organizations</p>
                {organizations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Create your first organization to get started.</p>
                ) : (
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {organizations.map((org) => (
                      <li key={org.id} className={cn("flex items-center justify-between")}>
                        <span className="text-foreground">{org.name}</span>
                        <span className="text-xs text-muted-foreground">{org.id.slice(0, 8)}…</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {orgLoadError && <p className="text-sm text-destructive">{orgLoadError}</p>}
        {projectLoadError && <p className="text-sm text-destructive">{projectLoadError}</p>}
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </CardContent>
    </Card>
  )
}
