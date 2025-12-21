-- 1. PROJECTS TABLE
-- Tracks individual software products or versions.
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(), -- Links to Supabase Auth
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SBOM COMPONENTS TABLE
-- Stores the inventory of packages discovered in the SBOM.
CREATE TABLE IF NOT EXISTS sbom_components (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  purl TEXT, -- Package URL for vulnerability API lookups
  license TEXT,
  author TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VULNERABILITIES TABLE (WITH FIX)
-- Tracks security flaws and the 24-hour reporting deadline.
CREATE TABLE IF NOT EXISTS vulnerabilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  component_id UUID REFERENCES sbom_components(id) ON DELETE CASCADE,
  cve_id TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Triaged', 'Reported', 'Patched')),
  
  -- Gap Fix: Assigning responsibility as requested in Problem Statement
  assigned_to UUID REFERENCES auth.users(id), 
  
  remediation_notes TEXT,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- FIX: Using UTC conversion to make the generated column immutable
  reporting_deadline TIMESTAMPTZ GENERATED ALWAYS AS (
    ((discovered_at AT TIME ZONE 'UTC') + INTERVAL '24 hours') AT TIME ZONE 'UTC'
  ) STORED,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMPLIANCE REPORTS TABLE
-- Logs evidence of repeatable reporting for CRA audits.
CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  report_type TEXT CHECK (report_type IN ('24h_Early_Warning', '72h_Notification', 'Annex_I_Summary')),
  vulnerability_id UUID REFERENCES vulnerabilities(id),
  generated_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  sent_to_regulator BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbom_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;

-- Create Policies so users can only see/edit their own data
CREATE POLICY "Users can manage their own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view components of their projects" ON sbom_components
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage vulnerabilities of their projects" ON vulnerabilities
  FOR ALL USING (
    component_id IN (
      SELECT id FROM sbom_components WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view their own reports" ON compliance_reports
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  ); 
