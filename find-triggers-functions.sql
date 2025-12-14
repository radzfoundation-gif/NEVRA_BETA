-- Find all triggers and functions on users table
-- These might be casting to UUID

-- 1. Check triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' 
    AND event_object_table = 'users';

-- 2. Check functions that might use users table
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_definition LIKE '%users%'
    AND routine_definition LIKE '%uuid%';

-- 3. Check if there's a constraint casting to UUID
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass;
