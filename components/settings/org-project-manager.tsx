"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/utils/supabase/client"
import { useProjectContext } from "@/components/project-context"
import { useRouter } from "next/navigation"
import type { OrganizationMemberRow, OrganizationRow, ProjectRow, SbomComponentRow, VulnerabilityRow } from "@/types/db"
import { Building2, FolderKanban, Users } from "lucide-react"
import { toast } from "sonner"

export function OrgProjectManager() {
  const supabase = useMemo(() => createClient(), [])
  const { projectId, setProjectId } = useProjectContext()
  const router = useRouter()
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([])
  const [memberships, setMemberships] = useState<OrganizationMemberRow[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [components, setComponents] = useState<SbomComponentRow[]>([])
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityRow[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState("")
  const [orgName, setOrgName] = useState("")
  const [projectName, setProjectName] = useState("")
  const [memberUserId, setMemberUserId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      toast.error("Please sign in to manage organizations")
      setIsLoading(false)
      return
    }
    setCurrentUserId(userData.user.id)

    const [orgResult, projectResult, memberResult, componentResult, vulnerabilityResult] = await Promise.all([
      supabase.from("organizations").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("organization_members").select("*"),
      supabase.from("sbom_components").select("*"),
      supabase.from("vulnerabilities").select("*"),
    ])

    if (!orgResult.error) {
      const orgs = orgResult.data ?? []
      setOrganizations(orgs)
      if (orgs.length > 0 && !selectedOrgId) {
        setSelectedOrgId(orgs[0].id)
      }
    }

    setProjects(projectResult.data ?? [])
    setMemberships(memberResult.data ?? [])
    setComponents(componentResult.data ?? [])
    setVulnerabilities(vulnerabilityResult.data ?? [])
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateOrg = async () => {
    if (!orgName.trim()) {
      toast.error("Organization name is required")
      return
    }

    const { data, error } = await supabase
      .from("organizations")
      .insert({ name: orgName.trim() })
      .select("id")
      .single()

    if (error || !data) {
      toast.error("Failed to create organization")
      return
    }

    await supabase
      .from("organization_members")
      .insert({ organization_id: data.id, user_id: currentUserId, role: "owner" })

    setOrgName("")
    toast.success("Organization created")
    loadData()
  }

  const handleCreateProject = async () => {
    if (!selectedOrgId) {
      toast.error("Select an organization first")
      return
    }
    if (!projectName.trim()) {
      toast.error("Project name is required")
      return
    }

    const { error } = await supabase
      .from("projects")
      .insert({ name: projectName.trim(), organization_id: selectedOrgId, user_id: currentUserId })

    if (error) {
      toast.error("Failed to create project")
      return
    }

    setProjectName("")
    toast.success("Project created")
    loadData()
  }

  const handleInviteMember = async () => {
    if (!selectedOrgId) {
      toast.error("Select an organization first")
      return
    }
    if (!memberUserId.trim()) {
      toast.error("User ID is required")
      return
    }

    const { error } = await supabase
      .from("organization_members")
      .insert({ organization_id: selectedOrgId, user_id: memberUserId.trim(), role: "member" })

    if (error) {
      toast.error("Failed to add member")
      return
    }

    setMemberUserId("")
    toast.success("Member added")
    loadData()
  }

  const activeOrgMembers = memberships.filter((m) => m.organization_id === selectedOrgId)
  const activeOrgProjects = projects.filter((p) => p.organization_id === selectedOrgId)

  const getProjectVulnCount = (projectId: string) => {
    const componentIds = components.filter((c) => c.project_id === projectId).map((c) => c.id)
    return vulnerabilities.filter((v) => componentIds.includes(v.component_id)).length
  }

  // Get member workload
  const getMemberWorkload = (userId: string) => {
    const now = Date.now()
    const activeVulns = vulnerabilities.filter(
      (v) => v.assigned_to === userId && v.status !== "Patched"
    )

    const critical = activeVulns.filter((v) => {
      const hoursRemaining = (new Date(v.reporting_deadline).getTime() - now) / (1000 * 60 * 60)
      return hoursRemaining < 12
    }).length

    const urgent = activeVulns.filter((v) => {
      const hoursRemaining = (new Date(v.reporting_deadline).getTime() - now) / (1000 * 60 * 60)
      return hoursRemaining >= 12 && hoursRemaining < 24
    }).length

    const normal = activeVulns.filter((v) => {
      const hoursRemaining = (new Date(v.reporting_deadline).getTime() - now) / (1000 * 60 * 60)
      return hoursRemaining >= 24
    }).length

    const total = activeVulns.length
    const status = critical > 3 ? "overloaded" : critical > 0 || urgent > 5 ? "moderate" : "healthy"

    return { critical, urgent, normal, total, status }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  return (
    <Tabs defaultValue="organizations" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-3">
        <TabsTrigger value="organizations">
          <Building2 className="h-4 w-4 mr-2" />
          Organizations
        </TabsTrigger>
        <TabsTrigger value="projects">
          <FolderKanban className="h-4 w-4 mr-2" />
          Projects
        </TabsTrigger>
        <TabsTrigger value="team">
          <Users className="h-4 w-4 mr-2" />
          Team
        </TabsTrigger>
      </TabsList>

      {/* Organizations Tab */}
      <TabsContent value="organizations" className="space-y-6 mt-6">
        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle>Create Organization</CardTitle>
            <CardDescription>Organizations group projects and team members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
            <Button onClick={handleCreateOrg} className="bg-primary text-primary-foreground">
              Create Organization
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle>Your Organizations</CardTitle>
            <CardDescription>{organizations.length} total</CardDescription>
          </CardHeader>
          <CardContent>
            {organizations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No organizations yet</p>
            ) : (
              <div className="space-y-2">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(org.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={selectedOrgId === org.id ? "default" : "outline"}
                      onClick={() => setSelectedOrgId(org.id)}
                    >
                      {selectedOrgId === org.id ? "Selected" : "Select"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Projects Tab */}
      <TabsContent value="projects" className="space-y-6 mt-6">
        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle>Create Project</CardTitle>
            <CardDescription>
              {selectedOrgId
                ? `Creating in ${organizations.find((o) => o.id === selectedOrgId)?.name}`
                : "Select an organization first"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-select">Organization</Label>
              <select
                id="org-select"
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select organization...</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="CRA Compliance Portal"
              />
            </div>
            <Button onClick={handleCreateProject} disabled={!selectedOrgId}>
              Create Project
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              {selectedOrgId
                ? `${activeOrgProjects.length} in ${organizations.find((o) => o.id === selectedOrgId)?.name}`
                : "Select an organization to view projects"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeOrgProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOrgProjects.map((project) => {
                  const vulnCount = getProjectVulnCount(project.id)
                  return (
                    <div
                      key={project.id}
                      className="p-4 border border-border rounded-lg space-y-3 hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.id.slice(0, 8)}...</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{vulnCount} vulnerabilities</span>
                        <Button
                          size="sm"
                          variant={projectId === project.id ? "default" : "outline"}
                          onClick={() => {
                            setProjectId(project.id)
                            router.push("/")
                          }}
                        >
                          {projectId === project.id ? "Active" : "Set Active"}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Team Tab */}
      <TabsContent value="team" className="space-y-6 mt-6">
        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle>Invite Team Member</CardTitle>
            <CardDescription>
              {selectedOrgId
                ? `Invite to ${organizations.find((o) => o.id === selectedOrgId)?.name}`
                : "Select an organization first"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-id">User ID</Label>
              <Input
                id="member-id"
                value={memberUserId}
                onChange={(e) => setMemberUserId(e.target.value)}
                placeholder="User UUID"
              />
            </div>
            <Button onClick={handleInviteMember} disabled={!selectedOrgId}>
              Add Member
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle>Team Member Health</CardTitle>
            <CardDescription>
              {selectedOrgId
                ? `${activeOrgMembers.length} members in ${organizations.find((o) => o.id === selectedOrgId)?.name}`
                : "Select an organization to view member workload"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeOrgMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOrgMembers.map((member) => {
                  const workload = getMemberWorkload(member.user_id)
                  const statusColors = {
                    overloaded: "border-red-500/50 bg-red-50/50 dark:bg-red-950/20",
                    moderate: "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20",
                    healthy: "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
                  }
                  const statusIcons = {
                    overloaded: "🔴",
                    moderate: "🟡",
                    healthy: "🟢",
                  }

                  return (
                    <div
                      key={member.id}
                      className={`p-4 border-2 rounded-lg ${statusColors[workload.status]}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">
                              {member.user_id.slice(0, 8)}...
                            </p>
                            {member.user_id === currentUserId && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        </div>
                        <span className="text-2xl">{statusIcons[workload.status]}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            Total Active
                          </span>
                          <span className="text-sm font-bold">{workload.total}</span>
                        </div>

                        <div className="h-px bg-border" />

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-red-600 dark:text-red-400">
                              Critical (&lt;12h)
                            </span>
                            <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                              {workload.critical}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                              Urgent (12-24h)
                            </span>
                            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                              {workload.urgent}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-green-600 dark:text-green-400">
                              Normal (&gt;24h)
                            </span>
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {workload.normal}
                            </span>
                          </div>
                        </div>

                        {workload.status === "overloaded" && (
                          <div className="mt-2 p-2 bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded text-xs text-red-800 dark:text-red-200">
                            ⚠ {workload.critical} critical deadline{workload.critical !== 1 ? "s" : ""} due in &lt;12 hours
                          </div>
                        )}

                        {workload.status === "moderate" && workload.urgent > 5 && (
                          <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
                            ⚡ High workload: {workload.urgent} urgent deadline{workload.urgent !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
