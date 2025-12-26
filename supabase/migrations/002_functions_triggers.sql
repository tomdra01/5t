-- 002_functions_triggers.sql
-- Helper functions, triggers, and business logic

-- 1. Helper: Update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vulnerabilities_updated_at BEFORE UPDATE ON vulnerabilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Helper: Check if user is Org Owner
CREATE OR REPLACE FUNCTION public.is_org_owner(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organizations
    WHERE id = org_id
      AND owner_id = (SELECT auth.uid())
  );
$$;

-- 3. Helper: Check if user can access project
CREATE OR REPLACE FUNCTION public.can_access_project(target_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM projects
    WHERE id = target_project_id
      AND (
        user_id = (SELECT auth.uid())
        OR organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = (SELECT auth.uid())
        )
      )
  );
$$;

-- 4. Logic: Get Latest SBOM Version
CREATE OR REPLACE FUNCTION public.get_latest_sbom_version(p_project_id UUID)
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_latest INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0)
  INTO v_latest
  FROM sbom_versions
  WHERE project_id = p_project_id;
  
  RETURN v_latest;
END;
$$;

-- 5. Logic: Log Remediation Milestone
CREATE OR REPLACE FUNCTION public.log_remediation_milestone(
  p_vulnerability_id UUID,
  p_milestone_type TEXT,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_triggered_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_sbom_version_id UUID DEFAULT NULL
)
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;
