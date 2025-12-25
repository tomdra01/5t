-- Migration: Add SBOM versioning and remediation tracking
-- This enables tracking SBOM evolution over time and automatic vulnerability resolution

-- SBOM Versions Table
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

-- Add version tracking to components
ALTER TABLE sbom_components ADD COLUMN IF NOT EXISTS sbom_version_id UUID REFERENCES sbom_versions(id) ON DELETE CASCADE;
ALTER TABLE sbom_components ADD COLUMN IF NOT EXISTS previous_version TEXT;

-- Remediation Milestones Table (audit trail)
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sbom_versions_project ON sbom_versions(project_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_components_version ON sbom_components(sbom_version_id);
CREATE INDEX IF NOT EXISTS idx_milestones_vuln ON remediation_milestones(vulnerability_id, milestone_date DESC);

-- Function to get latest SBOM version for a project
CREATE OR REPLACE FUNCTION get_latest_sbom_version(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_latest INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0)
  INTO v_latest
  FROM sbom_versions
  WHERE project_id = p_project_id;
  
  RETURN v_latest;
END;
$$ LANGUAGE plpgsql;

-- Function to log remediation milestone
CREATE OR REPLACE FUNCTION log_remediation_milestone(
  p_vulnerability_id UUID,
  p_milestone_type TEXT,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_triggered_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_sbom_version_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_milestone_id UUID;
BEGIN
  INSERT INTO remediation_milestones (
    vulnerability_id,
    milestone_type,
    old_value,
    new_value,
    triggered_by,
    notes,
    sbom_version_id
  ) VALUES (
    p_vulnerability_id,
    p_milestone_type,
    p_old_value,
    p_new_value,
    p_triggered_by,
    p_notes,
    p_sbom_version_id
  ) RETURNING id INTO v_milestone_id;
  
  RETURN v_milestone_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS for SBOM versions
ALTER TABLE sbom_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE remediation_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for SBOM versions
CREATE POLICY "Users can view SBOM versions of their org projects"
  ON sbom_versions FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert SBOM versions for their org projects"
  ON sbom_versions FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- RLS Policies for remediation milestones
CREATE POLICY "Users can view remediation milestones for their vulnerabilities"
  ON remediation_milestones FOR SELECT
  USING (
    vulnerability_id IN (
      SELECT v.id FROM vulnerabilities v
      INNER JOIN sbom_components sc ON sc.id = v.component_id
      INNER JOIN projects p ON p.id = sc.project_id
      INNER JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create remediation milestones for their vulnerabilities"
  ON remediation_milestones FOR INSERT
  WITH CHECK (
    vulnerability_id IN (
      SELECT v.id FROM vulnerabilities v
      INNER JOIN sbom_components sc ON sc.id = v.component_id
      INNER JOIN projects p ON p.id = sc.project_id
      INNER JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE sbom_versions IS 'Tracks SBOM upload history for version comparison and evolution';
COMMENT ON TABLE remediation_milestones IS 'Audit trail of vulnerability lifecycle events for compliance reporting';
COMMENT ON COLUMN sbom_versions.file_hash IS 'SHA-256 hash of uploaded SBOM file for duplicate detection';
COMMENT ON COLUMN remediation_milestones.milestone_type IS 'Event type: discovered, assigned, patched, auto_resolved, status_changed';
