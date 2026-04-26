const { Pool } = require('pg');

// This is the simplest way to connect. 
// If DATABASE_URL exists in Vercel, it uses it.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;