const { Pool } = require('pg');

let pool;

if (!pool) {
  if (!process.env.DATABASE_URL) {
    console.error('CRITICAL: DATABASE_URL is missing!');
  }
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 1 // Crucial for Serverless to avoid overwhelming Neon
  });
}

/**
 * Helper function to query the Postgres database
 */
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  pool
};
