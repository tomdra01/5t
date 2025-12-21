"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"
import { useProjectContext } from "@/components/project-context"
import type { OrganizationMemberRow, OrganizationRow, ProjectRow, SbomComponentRow, VulnerabilityRow } from "@/types/db"

const cardClass =
  "bg-white/80 backdrop-blur-md border border-neutral-200 rounded-[2rem] shadow-sm hover:shadow-md transition-all"

export function OrgProjectManager() {
  const supabase = useMemo(() => {
    if (typeof window === "undefined") {
      return null
    }
    return createClient()
  }, [])
  const { projectId, setProjectId } = useProjectContext()
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([])
  const [memberships, setMemberships] = useState<OrganizationMemberRow[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [components, setComponents] = useState<SbomComponentRow[]>([])
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityRow[]>([])
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
    if (!supabase) {
      return
    }
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

    const [orgResult, projectResult, memberResult, componentResult, vulnerabilityResult] = await Promise.all([
      supabase.from("organizations").select("id,name,owner_id,created_at,updated_at").order("created_at", { ascending: false }),
      supabase.from("projects").select("id,name,organization_id,user_id,created_at,updated_at").order("created_at", { ascending: false }),
      supabase.from("organization_members").select("id,organization_id,user_id,role,created_at"),
      supabase.from("sbom_components").select("id,project_id,name,version,purl,license,author,added_at"),
      supabase.from("vulnerabilities").select("id,component_id,cve_id,severity,status,assigned_to,remediation_notes,discovered_at,reporting_deadline,updated_at"),
    ])

    if (orgResult.error) {
      setOrgLoadError(`Unable to load organizations: ${orgResult.error.message}`)
    }
    if (projectResult.error) {
      setProjectLoadError(`Unable to load projects: ${projectResult.error.message}`)
    }

    if (!orgResult.error) {
      const orgs = orgResult.data ?? []
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

    if (!memberResult.error) {
      setMemberships(memberResult.data ?? [])
    }

    if (!componentResult.error) {
      setComponents(componentResult.data ?? [])
    }

    if (!vulnerabilityResult.error) {
      setVulnerabilities(vulnerabilityResult.data ?? [])
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
    if (!supabase) {
      return
    }
    const handleChange = () => {
      loadData(false)
    }

    const channel = supabase
      .channel("org-project-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "organizations" }, handleChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "organization_members" }, handleChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, handleChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "sbom_components" }, handleChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "vulnerabilities" }, handleChange)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const componentsByProject = useMemo(() => {
    const map = new Map<string, SbomComponentRow[]>()
    for (const component of components) {
      const bucket = map.get(component.project_id)
      if (bucket) {
        bucket.push(component)
      } else {
        map.set(component.project_id, [component])
      }
    }
    return map
  }, [components])

  const projectVulnerabilityStats = useMemo(() => {
    const componentToProject = new Map<string, string>()
    for (const component of components) {
      componentToProject.set(component.id, component.project_id)
    }

    const projectCounts = new Map<string, number>()
    const projectAssignees = new Map<string, string>()

    for (const vuln of vulnerabilities) {
      const project = componentToProject.get(vuln.component_id)
      if (!project) {
        continue
      }
      projectCounts.set(project, (projectCounts.get(project) ?? 0) + 1)
      if (!projectAssignees.get(project) && vuln.assigned_to) {
        projectAssignees.set(project, vuln.assigned_to)
      }
    }

    return { projectCounts, projectAssignees }
  }, [components, vulnerabilities])

  const memberActiveDeadlines = useMemo(() => {
    const counts = new Map<string, number>()
    for (const vuln of vulnerabilities) {
      if (!vuln.assigned_to) {
        continue
      }
      if (vuln.status && vuln.status.toLowerCase() === "patched") {
        continue
      }
      counts.set(vuln.assigned_to, (counts.get(vuln.assigned_to) ?? 0) + 1)
    }
    return counts
  }, [vulnerabilities])

  const handleCreateOrg = async () => {
    setError(null)
    setStatus(null)
    if (!orgName.trim()) {
      setError("Organization name is required.")
      return
    }

    if (!supabase) {
      setError("Supabase client not ready.")
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

    if (!supabase) {
      setError("Supabase client not ready.")
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
    loadData(false)
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

    if (!supabase) {
      setError("Supabase client not ready.")
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

  const handleAssignMember = async (projectId: string, memberId: string) => {
    setError(null)
    setStatus(null)
    if (!supabase) {
      setError("Supabase client not ready.")
      return
    }

    const componentIds = (componentsByProject.get(projectId) ?? []).map((component) => component.id)
    if (componentIds.length === 0) {
      setError("Upload an SBOM to generate vulnerabilities before assigning owners.")
      return
    }

    const { error: updateError } = await supabase
      .from("vulnerabilities")
      .update({ assigned_to: memberId || null })
      .in("component_id", componentIds)

    if (updateError) {
      setError(`Unable to assign member: ${updateError.message}`)
      return
    }

    setVulnerabilities((prev) =>
      prev.map((vuln) =>
        componentIds.includes(vuln.component_id) ? { ...vuln, assigned_to: memberId || null } : vuln,
      ),
    )
    setStatus("Assignment updated.")
  }

  const activeOrgMembers = memberships.filter((member) => member.organization_id === selectedOrgId)
  const activeOrgProjects = projects.filter((project) => project.organization_id === selectedOrgId)

  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Organizations & Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading organization data…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Active Organization</Label>
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
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-foreground">Projects</p>
                  <p className="text-xs text-muted-foreground">Assign owners, monitor compliance, and open triage.</p>
                </div>
                {projectId ? (
                  <span className="text-xs text-muted-foreground">Active project ID: {projectId.slice(0, 8)}…</span>
                ) : null}
              </div>

              {activeOrgProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {activeOrgProjects.map((project) => {
                    const vulnCount = projectVulnerabilityStats.projectCounts.get(project.id) ?? 0
                    const score = Math.max(25, Math.min(100, 100 - vulnCount * 7))
                    const assignee = projectVulnerabilityStats.projectAssignees.get(project.id) ?? ""
                    const members = memberships.filter((member) => member.organization_id === project.organization_id)

                    return (
                      <div key={project.id} className={cn(cardClass, "p-6 space-y-4")}> 
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-lg font-semibold text-foreground">{project.name}</p>
                            <p className="text-xs text-muted-foreground">{project.id.slice(0, 8)}…</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <ComplianceRing score={score} />
                            <span className="text-[10px] uppercase tracking-[0.2em] text-amber-600">Compliance</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Assigned members</p>
                          <div className="flex items-center">
                            {members.slice(0, 5).map((member, index) => (
                              <div
                                key={member.id}
                                className={cn(
                                  "h-8 w-8 rounded-full border border-white bg-neutral-900 text-white text-[10px] font-semibold flex items-center justify-center",
                                  index > 0 && "-ml-2",
                                )}
                                title={member.user_id}
                              >
                                {member.user_id.slice(0, 2).toUpperCase()}
                              </div>
                            ))}
                            {members.length === 0 && (
                              <span className="text-xs text-muted-foreground">Invite members to collaborate.</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Assign Member</Label>
                          <select
                            value={assignee}
                            onChange={(event) => handleAssignMember(project.id, event.target.value)}
                            className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-foreground"
                          >
                            <option value="">Unassigned</option>
                            {members.map((member) => (
                              <option key={member.id} value={member.user_id}>
                                {member.user_id.slice(0, 8)}… ({member.role})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => setProjectId(project.id)}
                            className={cn(
                              "text-xs font-semibold uppercase tracking-[0.2em]",
                              projectId === project.id ? "text-amber-600" : "text-muted-foreground",
                            )}
                          >
                            {projectId === project.id ? "Active Project" : "Set Active"}
                          </button>
                          <span className="text-xs text-muted-foreground">{vulnCount} vulnerabilities</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-foreground">Team Members</p>
                <p className="text-xs text-muted-foreground">Ownership and active deadlines by person.</p>
              </div>

              {activeOrgMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Invite members to see ownership coverage.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {activeOrgMembers.map((member) => (
                    <div key={member.id} className={cn(cardClass, "p-6 space-y-3")}> 
                      <div>
                        <p className="text-base font-semibold text-foreground">{member.user_id.slice(0, 10)}…</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Active Deadlines</span>
                        <span className="text-sm font-semibold text-foreground">
                          {memberActiveDeadlines.get(member.user_id) ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Projects touched</span>
                        <span className="text-sm text-foreground">
                          {projects.filter((project) => project.organization_id === member.organization_id).length}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

function ComplianceRing({ score }: { score: number }) {
  const ringStyle = {
    background: `conic-gradient(#f59e0b ${score * 3.6}deg, rgba(245, 158, 11, 0.15) 0deg)`,
  }

  return (
    <div className="h-16 w-16 rounded-full p-[3px]" style={ringStyle}>
      <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
        <span className="text-sm font-semibold text-amber-600">{score}%</span>
      </div>
    </div>
  )
}
