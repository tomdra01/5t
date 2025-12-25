"use server"

import { createClient } from "@/utils/supabase/server"
import type { UserSettingsRow } from "@/types/db"

export async function getSettings() {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
        return null
    }

    const { data: settings } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userData.user.id)
        .single()

    return settings as UserSettingsRow | null
}

export async function updateSettings(data: Partial<UserSettingsRow>) {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
        throw new Error("Unauthorized")
    }

    // Check if settings exist
    const { data: existing } = await supabase
        .from("user_settings")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .single()

    if (existing) {
        const { error } = await supabase
            .from("user_settings")
            .update({
                ...data,
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", userData.user.id)

        if (error) throw error
    } else {
        const { error } = await supabase
            .from("user_settings")
            .insert({
                user_id: userData.user.id,
                nvd_api_key: data.nvd_api_key,
                hybrid_scanning_enabled: data.hybrid_scanning_enabled ?? true,
            })

        if (error) throw error
    }

    return { success: true }
}
