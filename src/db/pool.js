// ✅ CORRECT (Uses the Vercel Environment Variable)
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon cloud connections
  }
});

module.exports = pool;