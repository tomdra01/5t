"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, CheckCircle, Clock } from "lucide-react"

interface TeamMember {
    id: string
    email: string
    role: string
}

interface MemberWorkload {
    memberId: string
    email: string
    criticalCount: number // <12h
    urgentCount: number // 12-24h
    normalCount: number // >24h
    totalCount: number
}

interface OwnershipModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    vulnerabilityId: string
    currentOwner: string | null
    projectId: string
    onAssign: (memberId: string) => Promise<void>
}

export function OwnershipModal({
    open,
    onOpenChange,
    vulnerabilityId,
    currentOwner,
    projectId,
    onAssign,
}: OwnershipModalProps) {
    const [members, setMembers] = useState<TeamMember[]>([])
    const [workloads, setWorkloads] = useState<Map<string, MemberWorkload>>(new Map())
    const [selectedMember, setSelectedMember] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (open) {
            loadMembersAndWorkload()
        }
    }, [open, projectId])

    const loadMembersAndWorkload = async () => {
        const supabase = createClient()

        // Load team members from organization
        const { data: projectData } = await supabase
            .from("projects")
            .select("organization_id, organizations:organization_id(owner_id)")
            .eq("id", projectId)
            .single()

        if (!projectData) return

        // Fetch organization members
        const { data: membersData } = await supabase
            .from("organization_members")
            .select(`
        user_id,
        role,
        profiles:user_id (
          id,
          email
        )
      `)
            .eq("organization_id", projectData.organization_id)

        const teamMembers: TeamMember[] = (membersData || [])
            .filter((m: any) => m.profiles)
            .map((m: any) => ({
                id: m.profiles.id,
                email: m.profiles.email,
                role: m.role,
            }))

        // Ensure OWNER is in the list (if not added to members table)
        // Check if owner_id is in teamMembers
        // We need to fetch owner profile if they are missing
        const ownerId = (projectData.organizations as any)?.owner_id

        if (ownerId && !teamMembers.find(m => m.id === ownerId)) {
            const { data: ownerProfile } = await supabase
                .from("profiles")
                .select("id, email")
                .eq("id", ownerId)
                .single()

            if (ownerProfile) {
                teamMembers.push({
                    id: ownerProfile.id,
                    email: ownerProfile.email,
                    role: 'owner'
                })
            }
        }

        setMembers(teamMembers)

        // Load workload for each member
        const workloadMap = new Map<string, MemberWorkload>()

        for (const member of teamMembers) {
            // Get all components for this project
            const { data: components } = await supabase
                .from("sbom_components")
                .select("id")
                .eq("project_id", projectId)

            if (!components || components.length === 0) continue

            const componentIds = components.map((c) => c.id)

            // Get vulnerabilities assigned to this member
            const { data: vulns } = await supabase
                .from("vulnerabilities")
                .select("id, reporting_deadline, status")
                .in("component_id", componentIds)
                .eq("assigned_to", member.id)
                .neq("status", "Patched")

            const now = Date.now()
            let criticalCount = 0
            let urgentCount = 0
            let normalCount = 0

            for (const vuln of vulns || []) {
                const deadline = new Date(vuln.reporting_deadline).getTime()
                const hoursRemaining = (deadline - now) / (1000 * 60 * 60)

                if (hoursRemaining < 12) {
                    criticalCount++
                } else if (hoursRemaining < 24) {
                    urgentCount++
                } else {
                    normalCount++
                }
            }

            workloadMap.set(member.id, {
                memberId: member.id,
                email: member.email,
                criticalCount,
                urgentCount,
                normalCount,
                totalCount: (vulns || []).length,
            })
        }

        setWorkloads(workloadMap)
    }

    const handleAssign = async () => {
        if (!selectedMember) return

        setIsLoading(true)
        try {
            await onAssign(selectedMember)
            onOpenChange(false)
        } catch (error) {
            console.error("Assignment failed:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const getWorkloadStatus = (workload: MemberWorkload) => {
        if (workload.criticalCount > 3) return "overloaded"
        if (workload.criticalCount > 0 || workload.urgentCount > 5) return "moderate"
        return "healthy"
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "overloaded":
                return "text-red-600"
            case "moderate":
                return "text-amber-600"
            default:
                return "text-green-600"
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "overloaded":
                return <AlertTriangle className="w-5 h-5 text-red-600" />
            case "moderate":
                return <Clock className="w-5 h-5 text-amber-600" />
            default:
                return <CheckCircle className="w-5 h-5 text-green-600" />
        }
    }

    const selectedWorkload = selectedMember ? workloads.get(selectedMember) : null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Assign Vulnerability Owner</DialogTitle>
                    <DialogDescription>
                        Select a team member to take ownership of this vulnerability. Review their current workload before assigning.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="member">Team Member</Label>
                        <Select value={selectedMember} onValueChange={setSelectedMember}>
                            <SelectTrigger id="member">
                                <SelectValue placeholder="Select team member..." />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map((member) => {
                                    const workload = workloads.get(member.id)
                                    const status = workload ? getWorkloadStatus(workload) : "healthy"

                                    return (
                                        <SelectItem key={member.id} value={member.id}>
                                            <div className="flex items-center justify-between w-full">
                                                <span>{member.email}</span>
                                                <span className={`ml-2 text-xs ${getStatusColor(status)}`}>
                                                    {workload?.totalCount || 0} active
                                                </span>
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedWorkload && (
                        <div className="border rounded-lg p-4 bg-muted/50">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-sm">Current Workload</h4>
                                {getStatusIcon(getWorkloadStatus(selectedWorkload))}
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Total Active Vulnerabilities:</span>
                                    <span className="font-semibold">{selectedWorkload.totalCount}</span>
                                </div>

                                <div className="h-px bg-border my-2" />

                                <div className="flex items-center justify-between">
                                    <span className="text-red-600">Critical (&lt;12h):</span>
                                    <span className="font-semibold text-red-600">{selectedWorkload.criticalCount}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-amber-600">Urgent (12-24h):</span>
                                    <span className="font-semibold text-amber-600">{selectedWorkload.urgentCount}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-green-600">Normal (&gt;24h):</span>
                                    <span className="font-semibold text-green-600">{selectedWorkload.normalCount}</span>
                                </div>
                            </div>

                            {getWorkloadStatus(selectedWorkload) === "overloaded" && (
                                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                    ⚠ This member has {selectedWorkload.criticalCount} critical vulnerabilities due in &lt;12 hours
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleAssign} disabled={!selectedMember || isLoading}>
                        {isLoading ? "Assigning..." : "Assign Owner"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
