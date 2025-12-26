-- 001_core_schema.sql
-- Consolidated schema for Organizations, Projects, SBOMs, and Compliance

-- Enable required extensions
-- Note: We install these in public or default schema as some (like http, pg_cron) 
-- do not support being moved or installed in custom schemas on all systems.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "http";

-- 1. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORGANIZATION MEMBERS
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

-- 3. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  repository_url TEXT,
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SBOM VERSIONS
CREATE TABLE IF NOT EXISTS sbom_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),
  component_count INTEGER DEFAULT 0,
  file_hash TEXT,
  UNIQUE(project_id, version_number),
  CONSTRAINT version_number_positive CHECK (version_number > 0)
);

CREATE INDEX IF NOT EXISTS idx_sbom_versions_project ON sbom_versions(project_id, version_number DESC);

-- 5. SBOM COMPONENTS
CREATE TABLE IF NOT EXISTS sbom_components (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sbom_version_id UUID REFERENCES sbom_versions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  type TEXT NOT NULL,
  purl TEXT,
  cpe TEXT,
  previous_version TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_components_version ON sbom_components(sbom_version_id);

-- 6. VULNERABILITIES
CREATE TABLE IF NOT EXISTS vulnerabilities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  component_id UUID REFERENCES sbom_components(id) ON DELETE CASCADE,
  cve_id TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'Low', -- Suggested: Low, Medium, High, Critical
  status TEXT NOT NULL DEFAULT 'Open',    -- Suggested: Open, Patched, Triaged, Ignored
  cvss_score NUMERIC,
  nvd_severity TEXT,
  nvd_score NUMERIC,
  source TEXT DEFAULT 'OSV',
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  reporting_deadline TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  fixed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN vulnerabilities.reporting_deadline IS 'CRA Article 15: 24-hour reporting deadline, can be set manually or defaults to discovered_at + 24h';

-- 7. REMEDIATION MILESTONES
CREATE TABLE IF NOT EXISTS remediation_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vulnerability_id UUID NOT NULL REFERENCES vulnerabilities(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL, -- 'discovered', 'assigned', 'patched', 'auto_resolved'
  milestone_date TIMESTAMPTZ DEFAULT NOW(),
  old_value TEXT,
  new_value TEXT,
  triggered_by UUID REFERENCES auth.users(id),
  notes TEXT,
  sbom_version_id UUID REFERENCES sbom_versions(id)
);

CREATE INDEX IF NOT EXISTS idx_milestones_vuln ON remediation_milestones(vulnerability_id, milestone_date DESC);
COMMENT ON TABLE remediation_milestones IS 'Audit trail of vulnerability lifecycle events for compliance reporting';

-- 8. COMPLIANCE REPORTS
CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  report_type TEXT,
  generated_by UUID REFERENCES auth.users(id),
  sent_to_regulator BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. USER SETTINGS
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nvd_api_key TEXT,
  hybrid_scanning_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. VULNERABILITY SCAN QUEUE
CREATE TABLE IF NOT EXISTS vuln_scan_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  component_id UUID REFERENCES sbom_components(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  attempts INT DEFAULT 0,
  last_attempt TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
