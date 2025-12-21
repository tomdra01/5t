GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  organizations,
  organization_members,
  projects,
  sbom_components,
  vulnerabilities,
  compliance_reports
TO authenticated;
