import type { SupabaseClient } from "@supabase/supabase-js"
import type { Component, CreateComponentInput } from "../models/component"

export class ComponentRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Component | null> {
    const { data, error } = await this.supabase
      .from("sbom_components")
      .select("*")
      .eq("id", id)
      .single()

    if (error) return null
    return data as Component
  }

  async findByProjectId(projectId: string): Promise<Component[]> {
    const { data, error } = await this.supabase
      .from("sbom_components")
      .select("*")
      .eq("project_id", projectId)
      .order("name")

    if (error) return []
    return data as Component[]
  }

  async findByProjectAndVersion(projectId: string, versionId: string): Promise<Component[]> {
    const { data, error } = await this.supabase
      .from("sbom_components")
      .select("*")
      .eq("project_id", projectId)
      .eq("sbom_version_id", versionId)
      .order("name")

    if (error) return []
    return data as Component[]
  }

  async findLatestByProject(projectId: string): Promise<Component[]> {
    const { data: latestVersion } = await this.supabase
      .rpc("get_latest_sbom_version", { p_project_id: projectId })

    if (!latestVersion) return []

    return this.findByProjectAndVersion(projectId, latestVersion.toString())
  }

  async findByName(projectId: string, name: string): Promise<Component | null> {
    const { data, error } = await this.supabase
      .from("sbom_components")
      .select("*")
      .eq("project_id", projectId)
      .eq("name", name)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) return null
    return data as Component
  }

  async create(input: CreateComponentInput): Promise<Component | null> {
    const { data, error } = await this.supabase
      .from("sbom_components")
      .insert({
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[ComponentRepo] Create error:", error)
      return null
    }
    return data as Component
  }

  async createMany(inputs: CreateComponentInput[]): Promise<Component[]> {
    const now = new Date().toISOString()
    const componentsWithTimestamps = inputs.map(input => ({
      ...input,
      created_at: now,
      updated_at: now,
    }))

    const { data, error } = await this.supabase
      .from("sbom_components")
      .insert(componentsWithTimestamps)
      .select()

    if (error) {
      console.error("[ComponentRepo] CreateMany error:", error)
      return []
    }
    return data as Component[]
  }
}
