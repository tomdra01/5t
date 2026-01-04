export interface Component {
  id: string
  project_id: string
  sbom_version_id: string
  name: string
  version: string
  purl: string | null
  license: string | null
  author: string | null
  created_at: string
  updated_at: string
}

export interface CreateComponentInput {
  project_id: string
  sbom_version_id: string
  name: string
  version: string
  purl?: string | null
  license?: string | null
  author?: string | null
}

export interface ComponentComparison {
  name: string
  oldVersion: string | null
  newVersion: string
  status: "new" | "upgraded" | "downgraded" | "unchanged"
  oldComponentId?: string
}
