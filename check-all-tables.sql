-- Check ALL tables and their structure
-- Run this to see complete database schema

-- 1. List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check ALL columns in users table
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Check ALL columns in chat_sessions table
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'chat_sessions'
ORDER BY ordinal_position;

-- 4. Check ALL columns in ai_usage table
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'ai_usage'
ORDER BY ordinal_position;

-- 5. Find ANY remaining UUID columns (not just user-related)
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND data_type = 'uuid'
ORDER BY table_name, column_name;
