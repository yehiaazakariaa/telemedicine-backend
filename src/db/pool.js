const { Pool } = require('pg');

// Create the pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // This is CRITICAL for Vercel + Neon
  }
});

// Test connection and log errors to Vercel
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Export the pool directly so 'pool.query' works in your doctor.js
module.exports = pool;