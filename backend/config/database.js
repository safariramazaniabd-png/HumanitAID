const env = require('./env');

let pool;
let query;

if (!env.databaseUrl) {
  console.warn('[DB] DATABASE_URL not set — running with mock (empty results).');
  pool = null;
  query = async () => ({ rows: [], rowCount: 0 });
} else {
  const { Pool } = require('pg');
  pool = new Pool({ connectionString: env.databaseUrl });
  pool.on('error', (err) => console.error('[DB] Unexpected pool error:', err));
  query = (text, params) => pool.query(text, params);
}

module.exports = { pool, query };
