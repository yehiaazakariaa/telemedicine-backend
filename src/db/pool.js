const { Pool } = require('pg');

// Force the connection string to be read
const dbUrl = process.env.DATABASE_URL;

console.log("System Check: DATABASE_URL is", dbUrl ? "FOUND" : "NOT FOUND");

const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;