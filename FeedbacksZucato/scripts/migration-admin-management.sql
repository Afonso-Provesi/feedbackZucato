ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS invited_by_email VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_admins_auth_user_id ON admins(auth_user_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admins'
      AND column_name = 'raw_email'
  ) THEN
    UPDATE admins
    SET raw_email = NULL;

    BEGIN
      ALTER TABLE admins DROP COLUMN raw_email;
    EXCEPTION
      WHEN undefined_column THEN NULL;
    END;
  END IF;
END $$;