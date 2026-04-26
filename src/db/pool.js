const { Pool } = require('pg');

const pool = new Pool({
  // This line forces the code to use the URL or fail gracefully
  connectionString: process.env.DATABASE_URL, 
  ssl: {
    rejectUnauthorized: false
  }
});

// Add this test to your log
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error("❌ DATABASE CONNECTION FAILED:", err.message);
  } else {
    console.log("✅ DATABASE CONNECTED SUCCESSFULLY");
  }
});

module.exports = pool;