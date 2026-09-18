// Exits 0 when the database has no users yet (so the seed should run), 1 otherwise.
//
// Used by docker-entrypoint.sh. seed.js clears timetable_slots before inserting, so
// re-running it on every container start would wipe timetable edits — this guard
// keeps the seed to the first boot against an empty database.
import mysql from 'mysql2/promise';
import process from 'process';

let needsSeed = 0; // 0 = seed, 1 = skip

try {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const [[row]] = await conn.query('SELECT COUNT(*) AS n FROM users');
  await conn.end();
  needsSeed = row.n > 0 ? 1 : 0;
} catch {
  // Table missing or unreachable — let the seed run and surface its own error.
  needsSeed = 0;
}

process.exit(needsSeed);
