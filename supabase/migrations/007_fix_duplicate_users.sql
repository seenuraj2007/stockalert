-- Check for duplicate users
SELECT email, COUNT(*) as count FROM users GROUP BY email HAVING COUNT(*) > 1;

-- Find duplicate users by ID
SELECT id, email, COUNT(*) as count FROM users GROUP BY id HAVING COUNT(*) > 1;

-- Check users table for issues
SELECT * FROM users WHERE id = 'd2f8a154-85dc-447a-bee6-8c38783e8441';

-- If there are duplicates, delete extras (keep one)
-- First, let's see how many rows exist for this user
SELECT COUNT(*) as user_count FROM users WHERE id = 'd2f8a154-85dc-447a-bee6-8c38783e8441';
