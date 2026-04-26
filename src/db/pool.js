const { Pool } = require('pg');

// This logic forces the app to use the Neon URL if it exists
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // This is MANDATORY for Neon/Vercel connections
  }
});

// Add this to your code to see what the backend is actually trying to connect to in the logs
console.log('Connecting to database with URL:', process.env.DATABASE_URL ? 'URL found' : 'URL NOT FOUND - using default');

pool.connect((err) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Successfully connected to Neon PostgreSQL');
  }
});