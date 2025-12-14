-- Find ALL columns that are still UUID type
-- Run this in Supabase SQL Editor to see what's still UUID

SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND data_type = 'uuid'
    AND column_name LIKE '%user%'
ORDER BY table_name, column_name;

-- This will show you which columns still need to be converted
