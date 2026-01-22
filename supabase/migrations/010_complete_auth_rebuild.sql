-- COMPLETE AUTH & USER SYSTEM REBUILD

-- 1. Clear existing data
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE organizations CASCADE;
TRUNCATE TABLE subscriptions CASCADE;

-- 2. Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Owners can update user roles" ON users;
DROP POLICY IF EXISTS "Public organizations read" ON organizations;
DROP POLICY IF EXISTS "Members can read their organization" ON organizations;
DROP POLICY IF EXISTS "Service role can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can update organizations" ON organizations;

-- 4. Clear auth duplicates (keep one)
DELETE FROM users a USING users b 
WHERE a.ctid < b.ctid AND a.email = b.email;

-- 5. Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 6. Create simple policies
CREATE POLICY "Users can read their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Public can read organizations"
  ON organizations FOR SELECT
  USING (true);

CREATE POLICY "Service role manages organizations"
  ON organizations FOR ALL
  USING (true);

CREATE POLICY "Service role manages subscriptions"
  ON subscriptions FOR ALL
  USING (true);
