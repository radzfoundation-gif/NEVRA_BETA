-- Check users table schema
-- Run this to see if users.id is TEXT or UUID

SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'users'
ORDER BY ordinal_position;

-- Expected: id should be TEXT, not UUID
