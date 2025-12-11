-- Find all views, rules, and dependencies that use user_id columns
-- Run this BEFORE migration to see what needs to be dropped

-- =====================================================
-- Find views that use user_id
-- =====================================================
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
    AND (
        definition LIKE '%user_id%'
        OR viewname LIKE '%user%'
    );

-- =====================================================
-- Find rules that use user_id
-- =====================================================
SELECT 
    schemaname,
    tablename,
    rulename,
    definition
FROM pg_rules
WHERE schemaname = 'public'
    AND (
        definition LIKE '%user_id%'
        OR rulename LIKE '%user%'
    );

-- =====================================================
-- Find all dependencies on user_id columns
-- =====================================================
SELECT 
    n.nspname as schema_name,
    c.relname as object_name,
    CASE c.relkind
        WHEN 'r' THEN 'table'
        WHEN 'v' THEN 'view'
        WHEN 'm' THEN 'materialized view'
        WHEN 'S' THEN 'sequence'
        WHEN 'f' THEN 'foreign table'
    END as object_type,
    a.attname as column_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE n.nspname = 'public'
    AND a.attname = 'user_id'
    AND a.attnum > 0
    AND NOT a.attisdropped
ORDER BY c.relname;

-- =====================================================
-- Find views that depend on tables with user_id
-- =====================================================
SELECT DISTINCT
    dependent_ns.nspname as dependent_schema,
    dependent_view.relname as dependent_view,
    source_ns.nspname as source_schema,
    source_table.relname as source_table
FROM pg_depend
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
JOIN pg_class dependent_view ON pg_rewrite.ev_class = dependent_view.oid
JOIN pg_class source_table ON pg_depend.refobjid = source_table.oid
JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
JOIN pg_namespace source_ns ON source_ns.oid = source_table.relnamespace
WHERE source_table.relname IN ('users', 'ai_usage', 'chat_sessions', 'projects', 'user_preferences')
    AND dependent_view.relkind = 'v'
    AND dependent_ns.nspname = 'public';

