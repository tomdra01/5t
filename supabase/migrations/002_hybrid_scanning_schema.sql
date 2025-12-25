-- 5. USER SETTINGS TABLE
-- Stores configuration for integrations like NVD API Key.
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nvd_api_key TEXT,
  hybrid_scanning_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- 6. VULNERABILITIES TABLE UPDATES
-- Add columns to store NVD enrichment data and source tracking.
ALTER TABLE vulnerabilities 
ADD COLUMN IF NOT EXISTS nvd_severity TEXT,
ADD COLUMN IF NOT EXISTS nvd_score NUMERIC,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'OSV';
