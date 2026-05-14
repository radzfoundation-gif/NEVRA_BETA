# Turso Migration Notes

UseGlass AI now uses Turso/libSQL for workspace data and credit usage APIs.

## Environment

Set these variables on the backend/API runtime:

```env
TURSO_DATABASE_URL=libsql://your-database-org.turso.io
TURSO_AUTH_TOKEN=your_turso_token
```

For local development without Turso credentials, the API falls back to a local SQLite/libSQL file:

```env
TURSO_LOCAL_URL=file:./useglass-turso.db
```

## Migrated data areas

- Workspace projects
- Project items and notes
- Saved AI outputs
- Documents library
- Daily credit usage
- Subscription lookup for credit tier

## API routes

- `GET /api/turso/health`
- `GET /api/turso/credits?userId=...`
- `POST /api/turso/credits/increment`
- `GET /api/turso/workspace?userId=...`
- `POST /api/turso/projects`
- `GET /api/turso/projects/:id?userId=...`
- `POST /api/turso/projects/:id/notes`
- `POST /api/turso/outputs`
- `GET /api/turso/documents?userId=...`
- `POST /api/turso/documents`

## Current boundary

Supabase Auth remains in place for login/session handling. The migrated app data above is served by Turso through backend API routes so the Turso auth token is never exposed to the browser.
