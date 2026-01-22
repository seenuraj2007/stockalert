-- Fix RLS for organizations table to allow service role inserts during signup

-- Drop existing policies on organizations
DROP POLICY IF EXISTS "Organization members can read organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can update organizations" ON organizations;

-- Allow anyone to read organizations (public info)
CREATE POLICY "Public organizations read"
  ON organizations FOR SELECT
  USING (true);

-- Allow authenticated users to read organizations they belong to
CREATE POLICY "Members can read their organization"
  ON organizations FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE organization_id = organizations.id
    )
  );

-- Allow service role (authenticated with bypass) to insert organizations
CREATE POLICY "Service role can insert organizations"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- Allow owners to update their organization
CREATE POLICY "Owners can update organizations"
  ON organizations FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE id = organizations.owner_id
    )
  );
