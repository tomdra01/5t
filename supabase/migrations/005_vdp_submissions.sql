-- 005_vdp_submissions.sql
-- Refined table for public vulnerability disclosure submissions
-- Style: Hardened and Documented (CRA Annex I Requirement)

-- 1. VDP SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS vdp_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL, -- Tie submission to a specific project if known
  reporter_name TEXT,
  reporter_email TEXT NOT NULL,
  vulnerability_title TEXT NOT NULL,
  affected_component TEXT,
  reproduction_steps TEXT,
  severity TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'accepted', 'rejected', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INDEXING FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_vdp_status ON vdp_submissions(status);
CREATE INDEX IF NOT EXISTS idx_vdp_project ON vdp_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_vdp_created ON vdp_submissions(created_at DESC);

-- 3. DOCUMENTATION (CRA ARTICLE 14/15)
COMMENT ON TABLE vdp_submissions IS 'CRA Annex I: Repository for external vulnerability disclosures and coordinated vulnerability handling';
COMMENT ON COLUMN vdp_submissions.status IS 'Lifecycle state of the disclosure for audit trail purposes';
COMMENT ON COLUMN vdp_submissions.reproduction_steps IS 'Evidence required by Article 14 for repeatable vulnerability analysis';

-- 4. HARDENED RLS POLICIES
ALTER TABLE vdp_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (public submission channel)
-- We use a dedicated name to avoid overlap
DROP POLICY IF EXISTS "Allow public submission" ON vdp_submissions;
CREATE POLICY "Allow public submission" 
ON vdp_submissions FOR INSERT 
WITH CHECK (true);

-- Policy: Authenticated users can only see submissions tied to projects they have access to
-- This mirrors the "style" of 003_secure_policies.sql
DROP POLICY IF EXISTS "Allow authenticated view" ON vdp_submissions;
CREATE POLICY "Allow authenticated view" 
ON vdp_submissions FOR SELECT 
TO authenticated 
USING (
  project_id IS NULL -- Allow seeing "orphaned" submissions if researcher didn't select a project
  OR public.can_access_project(project_id)
);

-- Policy: Triage access (Update)
DROP POLICY IF EXISTS "Allow authenticated update" ON vdp_submissions;
CREATE POLICY "Allow authenticated update" 
ON vdp_submissions FOR UPDATE 
TO authenticated 
USING (
  project_id IS NULL 
  OR public.can_access_project(project_id)
)
WITH CHECK (
  project_id IS NULL 
  OR public.can_access_project(project_id)
);

-- 5. GRANTS
GRANT SELECT, INSERT, UPDATE ON vdp_submissions TO authenticated;
GRANT INSERT ON vdp_submissions TO anon; -- Required for the public form to work without login
