-- Check which user has this email
SELECT id, email, role FROM users WHERE email = '214seenuraja@gmail.com';

-- Find auth.users entry
SELECT id, email FROM auth.users WHERE email = '214seenuraja@gmail.com';

-- Update the existing users record to match auth.users
UPDATE users 
SET id = 'd2f8a154-85dc-447a-bee6-8c38783e8441'
WHERE email = '214seenuraja@gmail.com';

-- Verify
SELECT * FROM users WHERE id = 'd2f8a154-85dc-447a-bee6-8c38783e8441';
