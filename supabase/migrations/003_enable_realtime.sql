-- Enable Realtime for the tables used in the dashboard
-- This is required for the client-side subscription to work

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE sbom_components;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE vulnerabilities;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
