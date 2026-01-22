-- Check if user exists in auth.users
SELECT * FROM auth.users WHERE id = 'd2f8a154-85dc-447a-bee6-8c38783e8441';

-- Check if user exists in public.users
SELECT * FROM users WHERE id = 'd2f8a154-85dc-447a-bee6-8c38783e8441';

-- If user is in auth but NOT in public.users, insert them
INSERT INTO users (id, email, full_name, organization_id, role, status)
SELECT 
  'd2f8a154-85dc-447a-bee6-8c38783e8441' as id,
  '214seenuraja@gmail.com' as email,
  'seenu' as full_name,
  NULL as organization_id,  -- Will be set during signup
  'member' as role,
  'active' as status
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT * FROM users WHERE id = 'd2f8a154-85dc-447a-bee6-8c38783e8441';
