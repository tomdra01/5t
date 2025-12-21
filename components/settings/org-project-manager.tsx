"use client"

import { useEffect, useState } from "react"
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
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState("")
  const [orgName, setOrgName] = useState("")
  const [projectName, setProjectName] = useState("")
  const [memberUserId, setMemberUserId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    setStatus(null)
    const supabase = createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      setError("Sign in to manage organizations and projects.")
      setIsLoading(false)
      return
    }

    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("id,name,owner_id")
      .order("created_at", { ascending: false })

    if (orgError) {
      setError("Unable to load organizations.")
      setIsLoading(false)
      return
    }

    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("id,name,organization_id")
      .order("created_at", { ascending: false })

    if (projectError) {
      setError("Unable to load projects.")
      setIsLoading(false)
      return
    }

    const orgs = orgData ?? []
    setOrganizations(orgs)
    setProjects(projectData ?? [])
    if (!selectedOrgId && orgs[0]) {
      setSelectedOrgId(orgs[0].id)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateOrg = async () => {
    if (!orgName.trim()) {
      setError("Organization name is required.")
      return
    }

    const supabase = createClient()
    const { error: insertError } = await supabase.from("organizations").insert({ name: orgName.trim() })
    if (insertError) {
      setError("Unable to create organization.")
      return
    }

    setOrgName("")
    setStatus("Organization created.")
    loadData()
  }

  const handleInviteMember = async () => {
    if (!selectedOrgId) {
      setError("Select an organization first.")
      return
    }

    if (!memberUserId.trim()) {
      setError("User ID is required.")
      return
    }

    const supabase = createClient()
    const { error: insertError } = await supabase
      .from("organization_members")
      .insert({ organization_id: selectedOrgId, user_id: memberUserId.trim(), role: "member" })

    if (insertError) {
      setError("Unable to add member. Ensure the user ID is valid.")
      return
    }

    setMemberUserId("")
    setStatus("Member added.")
  }

  const handleCreateProject = async () => {
    if (!selectedOrgId) {
      setError("Select an organization first.")
      return
    }

    if (!projectName.trim()) {
      setError("Project name is required.")
      return
    }

    const supabase = createClient()
    const { error: insertError } = await supabase
      .from("projects")
      .insert({ name: projectName.trim(), organization_id: selectedOrgId })

    if (insertError) {
      setError("Unable to create project.")
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
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </CardContent>
    </Card>
  )
}
