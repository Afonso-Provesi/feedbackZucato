ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS invited_by_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS role VARCHAR(16) NOT NULL DEFAULT 'admin';

ALTER TABLE admins
  DROP CONSTRAINT IF EXISTS admins_role_check;

ALTER TABLE admins
  ADD CONSTRAINT admins_role_check CHECK (role IN ('owner', 'admin'));

CREATE INDEX IF NOT EXISTS idx_admins_auth_user_id ON admins(auth_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_single_owner ON admins(role) WHERE role = 'owner';

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