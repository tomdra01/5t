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
}

export interface ComplianceReportRow {
  id: string
  project_id: string
  report_type: string | null
  generated_by: string | null
  sent_to_regulator: boolean | null
  created_at: string
}
