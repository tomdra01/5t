-- Add missing columns to sbom_components

-- Add type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sbom_components' AND column_name = 'type'
  ) THEN
    ALTER TABLE sbom_components ADD COLUMN type TEXT NOT NULL DEFAULT 'library';
  END IF;
END $$;

-- Add license column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sbom_components' AND column_name = 'license'
  ) THEN
    ALTER TABLE sbom_components ADD COLUMN license TEXT;
  END IF;
END $$;

-- Add author column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sbom_components' AND column_name = 'author'
  ) THEN
    ALTER TABLE sbom_components ADD COLUMN author TEXT;
  END IF;
END $$;
