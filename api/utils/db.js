const { Pool } = require('pg');

let pool;

if (!pool) {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('CRITICAL ERROR: DATABASE_URL environment variable is MISSING in Vercel settings.');
  } else {
    // Normalize string: ensure it starts with postgres:// (pg library preference)
    connectionString = connectionString.replace('postgresql://', 'postgres://');
    // Ensure it ends with ?sslmode=require if it doesn't have it
    if (!connectionString.includes('sslmode=')) {
      connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=require';
    }
  }
  
  pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    max: 1 
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
