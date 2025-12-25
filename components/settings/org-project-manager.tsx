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
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {selectedOrgId
                ? `${activeOrgMembers.length} in ${organizations.find((o) => o.id === selectedOrgId)?.name}`
                : "Select an organization to view members"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeOrgMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet</p>
            ) : (
              <div className="space-y-2">
                {activeOrgMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{member.user_id.slice(0, 16)}...</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                    </div>
                    {member.user_id === currentUserId && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">You</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
