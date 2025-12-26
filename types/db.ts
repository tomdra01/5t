export interface OrganizationRow {
  id: string
  name: string
  owner_id: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationMemberRow {
  id: string
  organization_id: string
  user_id: string
  role: "owner" | "admin" | "member"
  created_at: string
}

export interface ProjectRow {
  id: string
  name: string
  organization_id: string | null
  user_id: string | null
  created_at: string
  updated_at: string
}

export interface SbomComponentRow {
  id: string
  project_id: string
  name: string
  version: string
  purl: string | null
  license: string | null
  author: string | null
  added_at: string
  // Versioning
  sbom_version_id: string | null
  previous_version: string | null
}

export interface SbomVersionRow {
  id: string
  project_id: string
  version_number: number
  uploaded_at: string
  uploaded_by: string | null
  component_count: number
  file_hash: string | null
}

export interface VulnerabilityRow {
  id: string
  component_id: string
  cve_id: string
  severity: string | null
  status: string | null
  assigned_to: string | null
  remediation_notes: string | null
  discovered_at: string
  reporting_deadline: string
  updated_at: string | null
  // Hybrid Scanning additions
  nvd_severity: string | null
  nvd_score: number | null
  source: string | null
  fixed_at: string | null
}

export interface RemediationMilestoneRow {
  id: string
  vulnerability_id: string
  milestone_type: string
  milestone_date: string
  old_value: string | null
  new_value: string | null
  triggered_by: string | null
  notes: string | null
  sbom_version_id: string | null
}

export interface UserSettingsRow {
  user_id: string
  nvd_api_key: string | null
  hybrid_scanning_enabled: boolean
  created_at: string
  updated_at: string
}

export interface ComplianceReportRow {
  id: string
  project_id: string
  report_type: string | null
  generated_by: string | null
  sent_to_regulator: boolean | null
  created_at: string
}

export interface ProfileRow {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  updated_at: string | null
}
