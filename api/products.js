const { Pool } = require('pg');

let pool;

if (!pool) {
  let connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    connectionString = connectionString.replace('postgresql://', 'postgres://');
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
  const result = await pool.query(text, params);
  return result;
};

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { category, search, featured, id } = req.query;

    try {
      if (id) {
        const result = await query('SELECT * FROM products WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
        return res.status(200).json(result.rows[0]);
      }

      let q = 'SELECT * FROM products WHERE 1=1';
      let params = [];
      let count = 1;

      if (category) {
        q += ` AND category = $${count++}`;
        params.push(category);
      }
      
      if (search) {
        q += ` AND name ILIKE $${count++}`;
        params.push(`%${search}%`);
      }

      if (featured === 'true') {
        q += ` AND is_featured = $${count++}`;
        params.push(true);
      }

      q += ' ORDER BY created_at DESC';

      const result = await query(q, params);
      res.status(200).json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
};
