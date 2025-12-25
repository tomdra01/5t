-- Fix reporting_deadline from GENERATED column to allow manual setting
-- This enables Article 15 24-hour deadline control

-- Drop the generated column and recreate as regular column
ALTER TABLE vulnerabilities DROP COLUMN IF EXISTS reporting_deadline;

ALTER TABLE vulnerabilities ADD COLUMN reporting_deadline TIMESTAMPTZ 
  DEFAULT (NOW() + INTERVAL '24 hours');

-- Add comment
COMMENT ON COLUMN vulnerabilities.reporting_deadline IS 'CRA Article 15: 24-hour reporting deadline, can be set manually or defaults to discovered_at + 24h';
