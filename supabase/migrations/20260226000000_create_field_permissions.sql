-- Create field_permissions table
CREATE TABLE IF NOT EXISTS field_permissions (
  id INTEGER PRIMARY KEY DEFAULT 1,
  permissions JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default row
INSERT INTO field_permissions (id, permissions)
VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE field_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Only super_admin and admin can read
CREATE POLICY "Super admin and admin can read permissions"
ON field_permissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('super_admin', 'admin')
  )
);

-- Policy: Only super_admin and admin can update
CREATE POLICY "Super admin and admin can update permissions"
ON field_permissions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('super_admin', 'admin')
  )
);

-- Policy: Only super_admin and admin can insert
CREATE POLICY "Super admin and admin can insert permissions"
ON field_permissions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('super_admin', 'admin')
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_field_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER field_permissions_updated_at
BEFORE UPDATE ON field_permissions
FOR EACH ROW
EXECUTE FUNCTION update_field_permissions_updated_at();
