export interface SbomVersion {
  id: string
  project_id: string
  version_number: number
  uploaded_by: string
  component_count: number
  created_at: string
}

export interface ParsedComponent {
  name: string
  version: string
  purl?: string
  license?: string
  author?: string
}

export interface SbomUploadResult {
  success: boolean
  message: string
  componentsInserted: number
  vulnerabilitiesInserted: number
  componentsUpgraded?: number
  vulnerabilitiesAutoResolved?: number
}
