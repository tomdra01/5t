-- Ensure inserts into sbom_components, vulnerabilities, and compliance_reports pass RLS checks
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
        user_id = auth.uid()
        OR organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      )
  );
$$;

DROP POLICY IF EXISTS "Users can view components of their projects" ON sbom_components;
CREATE POLICY "Users can view components of their projects" ON sbom_components
  FOR ALL USING (
    public.can_access_project(project_id)
  )
  WITH CHECK (
    public.can_access_project(project_id)
  );

DROP POLICY IF EXISTS "Users can manage vulnerabilities of their projects" ON vulnerabilities;
CREATE POLICY "Users can manage vulnerabilities of their projects" ON vulnerabilities
  FOR ALL USING (
    component_id IN (
      SELECT id FROM sbom_components WHERE public.can_access_project(project_id)
    )
  )
  WITH CHECK (
    component_id IN (
      SELECT id FROM sbom_components WHERE public.can_access_project(project_id)
    )
  );

DROP POLICY IF EXISTS "Users can view their own reports" ON compliance_reports;
CREATE POLICY "Users can view their own reports" ON compliance_reports
  FOR ALL USING (
    public.can_access_project(project_id)
  )
  WITH CHECK (
    public.can_access_project(project_id)
  );
