#!/usr/bin/env node
// Mini Turso/libSQL shell — pengganti `turso db shell` untuk Windows.
// Usage:
//   node scripts/db.mjs "SELECT * FROM glass_tools LIMIT 3"
//   node scripts/db.mjs --tables
//   node scripts/db.mjs --schema chat_sessions
//   node scripts/db.mjs --counts
//   node scripts/db.mjs --local "SELECT count(*) FROM projects"
//
// Default target adalah TURSO_DATABASE_URL (prod). Pakai --local untuk hit useglass-turso.db.

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.local'), override: true });

const argv = process.argv.slice(2);
const useLocal = argv.includes('--local');
const wantTables = argv.includes('--tables');
const wantCounts = argv.includes('--counts');
const schemaIdx = argv.indexOf('--schema');
const wantSchema = schemaIdx !== -1 ? argv[schemaIdx + 1] : null;
const sql = argv.filter(a => !a.startsWith('--') && a !== wantSchema).join(' ').trim();

const url = useLocal
  ? (process.env.TURSO_LOCAL_URL || 'file:./useglass-turso.db')
  : (process.env.TURSO_DATABASE_URL || process.env.TURSO_LOCAL_URL || 'file:./useglass-turso.db');
const authToken = url.startsWith('libsql://') ? process.env.TURSO_AUTH_TOKEN : undefined;

if (url.startsWith('libsql://') && !authToken) {
  console.error('ERROR: TURSO_AUTH_TOKEN not set for libsql://');
  process.exit(1);
}

const target = url.startsWith('libsql://') ? `prod (${url.replace(/^libsql:\/\//, '').split('.')[0]})` : `local (${url})`;
console.log(`[db.mjs] target: ${target}`);

const client = createClient({ url, authToken });

async function run(query, args = []) {
  const r = await client.execute({ sql: query, args });
  return r;
}

function printRows(rows) {
  if (rows.length === 0) {
    console.log('(no rows)');
    return;
  }
  console.table(rows.map(r => {
    const o = {};
    for (const k of Object.keys(r)) {
      const v = r[k];
      o[k] = typeof v === 'string' && v.length > 60 ? v.slice(0, 57) + '...' : v;
    }
    return o;
  }));
}

try {
  if (wantTables) {
    const r = await run("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    console.log(`Tables (${r.rows.length}):`);
    r.rows.forEach(row => console.log('  -', row.name));
  } else if (wantSchema) {
    const r = await run("SELECT sql FROM sqlite_schema WHERE type='table' AND name = ?", [wantSchema]);
    if (r.rows.length === 0) {
      console.log(`Table not found: ${wantSchema}`);
    } else {
      console.log(r.rows[0].sql);
    }
    const idx = await run("SELECT name, sql FROM sqlite_schema WHERE type='index' AND tbl_name = ? AND name NOT LIKE 'sqlite_%'", [wantSchema]);
    if (idx.rows.length) {
      console.log(`\nIndexes (${idx.rows.length}):`);
      idx.rows.forEach(row => console.log('  ', row.sql));
    }
  } else if (wantCounts) {
    const tables = await run("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    const out = [];
    for (const { name } of tables.rows) {
      const c = await run(`SELECT count(*) as n FROM "${name}"`);
      out.push({ table: name, rows: Number(c.rows[0].n) });
    }
    console.table(out);
  } else if (sql) {
    const r = await run(sql);
    if (r.rows.length) {
      printRows(r.rows);
      console.log(`(${r.rows.length} rows)`);
    } else if (r.rowsAffected !== undefined) {
      console.log(`OK. rowsAffected=${r.rowsAffected}, lastInsertRowid=${r.lastInsertRowid ?? '-'}`);
    } else {
      console.log('(no rows)');
    }
  } else {
    console.log(`Usage:
  node scripts/db.mjs "<SQL>"            run SQL on prod Turso
  node scripts/db.mjs --local "<SQL>"    run SQL on local DB
  node scripts/db.mjs --tables           list tables
  node scripts/db.mjs --schema <table>   show CREATE TABLE + indexes
  node scripts/db.mjs --counts           row counts per table`);
  }
} catch (e) {
  console.error('ERROR:', e.message);
  process.exit(1);
}
