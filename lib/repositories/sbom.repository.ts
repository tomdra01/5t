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
    componentCount: number,
    fileHash?: string
  ): Promise<SbomVersion | null> {
    const { data, error } = await this.supabase
      .from("sbom_versions")
      .insert({
        project_id: projectId,
        version_number: versionNumber,
        uploaded_by: uploadedBy,
        component_count: componentCount,
        file_hash: fileHash || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[SbomRepo] Create version error:", error)
      return null
    }
    return data as SbomVersion
  }

  async findVersionByHash(projectId: string, fileHash: string): Promise<SbomVersion | null> {
    const { data, error } = await this.supabase
      .from("sbom_versions")
      .select("*")
      .eq("project_id", projectId)
      .eq("file_hash", fileHash)
      .single()

    if (error) return null
    return data as SbomVersion
  }

  async updateVersionTimestamp(versionId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("sbom_versions")
      .update({ uploaded_at: new Date().toISOString() })
      .eq("id", versionId)

    return !error
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
