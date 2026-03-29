const { Pool } = require('pg');

let pool;

if (!pool) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('CRITICAL ERROR: DATABASE_URL environment variable is MISSING in Vercel settings.');
  }
  
  pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    max: 1 // Crucial for Serverless to prevent too many connections to Neon
  });
}

const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error('DATABASE QUERY ERROR:', err.message, '| QUERY:', text);
    throw err;
  }
};

module.exports = {
  query,
  pool
};
