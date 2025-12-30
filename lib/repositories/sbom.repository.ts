import type { SupabaseClient } from "@supabase/supabase-js"
import type { SbomVersion } from "../models/sbom"

export class SbomRepository {
  constructor(private supabase: SupabaseClient) {}

  async getLatestVersion(projectId: string): Promise<number> {
    const { data } = await this.supabase
      .rpc("get_latest_sbom_version", { p_project_id: projectId })

    return data || 0
  }

  async createVersion(
    projectId: string,
    versionNumber: number,
    uploadedBy: string,
    componentCount: number
  ): Promise<SbomVersion | null> {
    const { data, error } = await this.supabase
      .from("sbom_versions")
      .insert({
        project_id: projectId,
        version_number: versionNumber,
        uploaded_by: uploadedBy,
        component_count: componentCount,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[SbomRepo] Create version error:", error)
      return null
    }
    return data as SbomVersion
  }

  async findVersionById(id: string): Promise<SbomVersion | null> {
    const { data, error } = await this.supabase
      .from("sbom_versions")
      .select("*")
      .eq("id", id)
      .single()

    if (error) return null
    return data as SbomVersion
  }

  async findVersionsByProject(projectId: string): Promise<SbomVersion[]> {
    const { data, error } = await this.supabase
      .from("sbom_versions")
      .select("*")
      .eq("project_id", projectId)
      .order("version_number", { ascending: false })

    if (error) return []
    return data as SbomVersion[]
  }
}
