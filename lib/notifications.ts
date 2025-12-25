import { createClient } from "@/utils/supabase/server"

interface NotificationPayload {
    userId: string
    title: string
    message: string
    type: "vulnerability_assigned" | "new_cve_discovered" | "deadline_approaching"
    vulnerabilityId?: string
    projectId?: string
}

/**
 * Send notification to a user
 * In production, this would integrate with:
 * - Email service (SendGrid, Resend, etc.)
 * - Slack webhook
 * - In-app notifications table
 * - Push notifications
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
    const supabase = await createClient()

    // For now, we'll just log to console and store in a notifications table
    // You can extend this to send actual emails/Slack messages

    try {
        // Get user email
        const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", payload.userId)
            .single()

        if (!profile?.email) {
            console.warn(`No email found for user ${payload.userId}`)
            return false
        }

        // TODO: Implement actual notification sending
        // Example with email service:
        // await sendEmail({
        //   to: profile.email,
        //   subject: payload.title,
        //   text: payload.message,
        // })

        // For development: log to console
        console.log(`[NOTIFICATION] To: ${profile.email}`)
        console.log(`[NOTIFICATION] Title: ${payload.title}`)
        console.log(`[NOTIFICATION] Message: ${payload.message}`)
        console.log(`[NOTIFICATION] Type: ${payload.type}`)

        // Store in-app notification (optional - requires notifications table)
        // await supabase.from("notifications").insert({
        //   user_id: payload.userId,
        //   title: payload.title,
        //   message: payload.message,
        //   type: payload.type,
        //   vulnerability_id: payload.vulnerabilityId,
        //   project_id: payload.projectId,
        //   read: false,
        // })

        return true
    } catch (error) {
        console.error("Failed to send notification:", error)
        return false
    }
}

/**
 * Send notification about new CVE discovered during daily scan
 */
export async function notifyNewCVE(params: {
    componentId: string
    cveId: string
    severity: string
    deadline: Date
}): Promise<void> {
    const supabase = await createClient()

    // Get component owner (assigned user)
    const { data: component } = await supabase
        .from("sbom_components")
        .select("project_id, name, version")
        .eq("id", params.componentId)
        .single()

    if (!component) return

    // Find project owner or assigned members
    const { data: project } = await supabase
        .from("projects")
        .select("name, organization_id, user_id")
        .eq("id", component.project_id)
        .single()

    if (!project) return

    const hoursRemaining = Math.floor((params.deadline.getTime() - Date.now()) / (1000 * 60 * 60))

    await sendNotification({
        userId: project.user_id,
        title: `New ${params.severity} vulnerability discovered`,
        message: `${params.cveId} affects ${component.name}@${component.version} in project "${project.name}". CRA Article 15 requires reporting within ${hoursRemaining} hours (deadline: ${params.deadline.toLocaleString()}).`,
        type: "new_cve_discovered",
        projectId: component.project_id,
    })
}

/**
 * Send notification about vulnerability assignment
 */
export async function notifyAssignment(params: {
    userId: string
    vulnerabilityId: string
    cveId: string
    projectName: string
    deadline: Date
}): Promise<void> {
    const hoursRemaining = Math.floor((params.deadline.getTime() - Date.now()) / (1000 * 60 * 60))

    await sendNotification({
        userId: params.userId,
        title: "Vulnerability assigned to you",
        message: `You've been assigned ${params.cveId} in project "${params.projectName}". Reporting deadline: ${params.deadline.toLocaleString()} (${hoursRemaining}h remaining).`,
        type: "vulnerability_assigned",
        vulnerabilityId: params.vulnerabilityId,
    })
}
