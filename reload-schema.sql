-- Force PostgREST to reload the schema cache
-- This is necessary after altering column types so the API knows about the changes
NOTIFY pgrst, 'reload schema';
