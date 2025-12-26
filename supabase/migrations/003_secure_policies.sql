-- 003_secure_policies.sql
-- Row Level Security Policies

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbom_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbom_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE remediation_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Grant Access
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 1. ORGANIZATIONS POLICIES
-- Consolidated to avoid overlap warnings
-- Owners can do everything. Members can view.
CREATE POLICY "Access organizations" ON organizations
  FOR SELECT USING (
    owner_id = (SELECT auth.uid())
    OR id IN (SELECT organization_id FROM organization_members WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Manage organizations" ON organizations
  FOR ALL USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));
-- Note: "Manage" covers SELECT too, but for owners, both return true.
-- However, "For ALL" includes SELECT. If we have a separate FOR SELECT, Supabase might flag it.
-- Better approach:
-- Policy 1: Owner All Access
-- Policy 2: Member Read Access (EXCLUDING owners to avoid overlap redundancy if strict)
-- But usually Supabase warning is about *permissive* policies.
-- If I have Policy A (All for Owner) and Policy B (Select for Members), and Owner is not in Members table, they don't overlap in logic but might overlap in definition space?
-- No, the warning "multiple permissive policies" means for a given row and action, more than one policy returns true.
-- If I am owner, Policy A is true. Policy B is false (if not member). ONE policy. Good.
-- If I am member, Policy A is false. Policy B is true. ONE policy. Good.
-- If I am BOTH (owner added as member), Policy A is true, Policy B is true. TWO policies. Warning.
-- So, to be safe, I should exclude owner from Member policy.
-- OR allow overlap and ignore warning? No, user wants to fix it.
-- FIX:
-- SELECT Policy: Owner OR Member.
-- INSERT/UPDATE/DELETE Policy: Owner only.

DROP POLICY IF EXISTS "Access organizations" ON organizations;
DROP POLICY IF EXISTS "Manage organizations" ON organizations;

-- Single Consolidated SELECT Policy
CREATE POLICY "View organizations" ON organizations
  FOR SELECT USING (
    owner_id = (SELECT auth.uid())
    OR id IN (SELECT organization_id FROM organization_members WHERE user_id = (SELECT auth.uid()))
  );

-- Write Policies (Split to avoid SELECT overlap)
CREATE POLICY "Insert organizations" ON organizations
  FOR INSERT WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Update organizations" ON organizations
  FOR UPDATE USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "Delete organizations" ON organizations
  FOR DELETE USING (owner_id = (SELECT auth.uid()));


-- 2. ORGANIZATION MEMBERS POLICIES
-- View: users see themselves OR owners see all members
CREATE POLICY "View members" ON organization_members
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    OR public.is_org_owner(organization_id)
  );

-- Manage: owners only
CREATE POLICY "Manage members" ON organization_members
  FOR INSERT WITH CHECK (public.is_org_owner(organization_id));

CREATE POLICY "Update members" ON organization_members
  FOR UPDATE USING (public.is_org_owner(organization_id));

CREATE POLICY "Delete members" ON organization_members
  FOR DELETE USING (public.is_org_owner(organization_id));


-- 3. PROJECTS POLICIES
-- Users manage own projects OR org projects
CREATE POLICY "Access projects" ON projects
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Manage projects" ON projects
  FOR INSERT WITH CHECK (
    user_id = (SELECT auth.uid())
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Update projects" ON projects
  FOR UPDATE USING (
    user_id = (SELECT auth.uid())
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Delete projects" ON projects
  FOR DELETE USING (
    user_id = (SELECT auth.uid())
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = (SELECT auth.uid()))
  );
-- (Could consolidate these into fewer policies if logic is identical for all ops, but splitting ensures no "multiple permissive" on SELECT if I had mixed them)
-- Actually, if logic is identical for ALL, I can use FOR ALL.
-- But earlier I split Org policies because View logic != Manage logic.
-- For Projects, User/Member has full access effectively?
-- Old policy: "Users can manage their own projects" FOR ALL.
-- Yes, seems so. So I will combine Projects into ONE policy.
DROP POLICY IF EXISTS "Access projects" ON projects;
DROP POLICY IF EXISTS "Manage projects" ON projects;
DROP POLICY IF EXISTS "Update projects" ON projects;
DROP POLICY IF EXISTS "Delete projects" ON projects;

CREATE POLICY "Manage projects" ON projects
  FOR ALL USING (
    user_id = (SELECT auth.uid())
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = (SELECT auth.uid()))
  );


-- 4. SBOM COMPONENTS POLICIES
-- Inherit from Project access
CREATE POLICY "Manage components" ON sbom_components
  FOR ALL USING (public.can_access_project(project_id))
  WITH CHECK (public.can_access_project(project_id));


-- 5. VULNERABILITIES POLICIES
-- Inherit from Component -> Project access
CREATE POLICY "Manage vulnerabilities" ON vulnerabilities
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


-- 6. SBOM VERSIONS POLICIES
CREATE POLICY "Manage sbom_versions" ON sbom_versions
  FOR ALL USING (public.can_access_project(project_id))
  WITH CHECK (public.can_access_project(project_id));


-- 7. REMEDIATION MILESTONES POLICIES
CREATE POLICY "Manage remediation_milestones" ON remediation_milestones
  FOR ALL USING (
    vulnerability_id IN (
      SELECT v.id FROM vulnerabilities v
      INNER JOIN sbom_components sc ON sc.id = v.component_id
      WHERE public.can_access_project(sc.project_id)
    )
  )
  WITH CHECK (
    vulnerability_id IN (
      SELECT v.id FROM vulnerabilities v
      INNER JOIN sbom_components sc ON sc.id = v.component_id
      WHERE public.can_access_project(sc.project_id)
    )
  );


-- 8. COMPLIANCE REPORTS POLICIES
CREATE POLICY "Manage reports" ON compliance_reports
  FOR ALL USING (public.can_access_project(project_id))
  WITH CHECK (public.can_access_project(project_id));


-- 9. USER SETTINGS POLICIES
CREATE POLICY "Manage own settings" ON user_settings
  FOR ALL USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
