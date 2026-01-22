-- Fix RLS for users table to allow new user creation

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Owners can update user roles" ON users;

-- Allow anyone to insert (for new user creation during signup/login)
CREATE POLICY "Anyone can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY "Users can read their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
