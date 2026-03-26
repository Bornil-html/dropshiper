const { Pool } = require('pg');

let pool;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // Mock pool or throw error in production. But Vercel sets DATABASE_URL
  console.warn('DATABASE_URL is not defined in the environment!');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost/mydb'
  });
}

/**
 * Helper function to query the Postgres database
 */
const query = (text, params) => pool.query(text, params);

module.exports = {
  query,
  pool
};
