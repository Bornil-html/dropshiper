const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

let pool;
if (!pool) {
  let connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    connectionString = connectionString.replace('postgresql://', 'postgres://');
    if (!connectionString.includes('sslmode=')) {
      connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=verify-full';
    }
  }
  pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }, // Maintain current manual override
    max: 1 
  });
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dropship_key_2026';

const query = async (text, params) => {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
};

module.exports = async (req, res) => {
  let user;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error();
    const token = authHeader.split(' ')[1];
    user = jwt.verify(token, JWT_SECRET);
    if (user.role !== 'admin') throw new Error();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized - Admin Only' });
  }

  if (req.method === 'GET') {
    try {
      const result = await query('SELECT * FROM products ORDER BY created_at DESC');
      return res.status(200).json(result.rows);
    } catch (err) {
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  }

  if (req.method === 'POST') {
    const { name, description, price, image_url, category, is_featured } = req.body;
    try {
      const r = await query(
        `INSERT INTO products (name, description, price, image_url, category, is_featured) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [name, description, price, image_url, category, is_featured || false]
      );
      return res.status(201).json(r.rows[0]);
    } catch (err) {
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'Missing product ID' });
    try {
      await query('DELETE FROM products WHERE id = $1', [id]);
      return res.status(200).json({ message: 'Product deleted' });
    } catch (err) {
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const { name, description, price, image_url, category, is_featured } = req.body;
    try {
      const updated = await query(
        `UPDATE products SET name=$1, description=$2, price=$3, image_url=$4, category=$5, is_featured=$6
         WHERE id=$7 RETURNING *`,
         [name, description, price, image_url, category, is_featured || false, id]
      );
      return res.status(200).json(updated.rows[0]);
    } catch (err) {
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
};
