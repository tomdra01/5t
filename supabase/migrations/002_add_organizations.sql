-- 1. ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORGANIZATION MEMBERS TABLE
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

-- 3. PROJECTS: LINK TO ORGANIZATION
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;


ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Organizations: owners manage, members can view
DROP POLICY IF EXISTS "Org owners can manage orgs" ON organizations;
CREATE POLICY "Org owners can manage orgs" ON organizations
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Org members can view orgs" ON organizations;
CREATE POLICY "Org members can view orgs" ON organizations
  FOR SELECT USING (
    owner_id = auth.uid()
    OR id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Organization members: owners manage, users can view their membership
DROP POLICY IF EXISTS "Org owners can manage members" ON organization_members;
CREATE POLICY "Org owners can manage members" ON organization_members
  FOR ALL USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view their memberships" ON organization_members;
CREATE POLICY "Users can view their memberships" ON organization_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
  );

-- Update project-level policies to allow org access
DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
CREATE POLICY "Users can manage their own projects" ON projects
  FOR ALL USING (
    user_id = auth.uid()
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Components, vulnerabilities, reports: derive access from project org or owner
DROP POLICY IF EXISTS "Users can view components of their projects" ON sbom_components;
CREATE POLICY "Users can view components of their projects" ON sbom_components
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects
      WHERE user_id = auth.uid()
        OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage vulnerabilities of their projects" ON vulnerabilities;
CREATE POLICY "Users can manage vulnerabilities of their projects" ON vulnerabilities
  FOR ALL USING (
    component_id IN (
      SELECT id FROM sbom_components
      WHERE project_id IN (
        SELECT id FROM projects
        WHERE user_id = auth.uid()
          OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can view their own reports" ON compliance_reports;
CREATE POLICY "Users can view their own reports" ON compliance_reports
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects
      WHERE user_id = auth.uid()
        OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    )
  );
