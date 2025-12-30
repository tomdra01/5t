"use server"

import { createClient } from "@/utils/supabase/server"

interface VdpSubmissionInput {
    projectId?: string
    name?: string
    email: string
    title: string
    component?: string
    steps: string
    severity: string
}

export async function submitVdpAction(input: VdpSubmissionInput) {
    const supabase = await createClient()

    const { error } = await supabase.from("vdp_submissions").insert({
        project_id: input.projectId,
        reporter_name: input.name,
        reporter_email: input.email,
        vulnerability_title: input.title,
        affected_component: input.component,
        reproduction_steps: input.steps,
        severity: input.severity,
    })

    if (error) {
        console.error("VDP Submission Error:", error)
        return { success: false, message: "Failed to submit report. Please try again later." }
    }

    return { success: true, message: "Thank you for your submission. Our team will review it shortly." }
}
