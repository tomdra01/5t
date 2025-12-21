-- Fix RLS recursion between organizations and organization_members
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
      AND owner_id = auth.uid()
  );
$$;

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org owners can manage members" ON organization_members;
CREATE POLICY "Org owners can manage members" ON organization_members
  FOR ALL USING (
    public.is_org_owner(organization_id)
  )
  WITH CHECK (
    public.is_org_owner(organization_id)
  );

DROP POLICY IF EXISTS "Users can view their memberships" ON organization_members;
CREATE POLICY "Users can view their memberships" ON organization_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_org_owner(organization_id)
  );
