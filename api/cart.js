const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

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
    max: 1 // Crucial for Serverless to avoid overwhelming Neon
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
    if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('No token');
    const token = authHeader.split(' ')[1];
    user = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const q = `
        SELECT c.id as cart_item_id, c.quantity, p.* 
        FROM cart_items c 
        JOIN products p ON c.product_id = p.id 
        WHERE c.user_id = $1
        ORDER BY c.created_at DESC
      `;
      const result = await query(q, [user.id]);
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  }

  if (req.method === 'POST') {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ message: 'Missing product_id' });

    try {
      const check = await query('SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2', [user.id, productId]);
      if (check.rows.length > 0) {
        const updated = await query(
          'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2 RETURNING *',
          [quantity, check.rows[0].id]
        );
        return res.status(200).json(updated.rows[0]);
      } else {
        const added = await query(
          'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
          [user.id, productId, quantity]
        );
        return res.status(201).json(added.rows[0]);
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const { itemId, clean } = req.query; 
    try {
      if (clean === 'true') {
        await query('DELETE FROM cart_items WHERE user_id = $1', [user.id]);
        return res.status(200).json({ message: 'Cart cleared' });
      }
      if (!itemId) return res.status(400).json({ message: 'Missing itemId' });
      const result = await query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *', [itemId, user.id]);
      if (result.rows.length === 0) return res.status(404).json({ message: 'Item not found' });
      return res.status(200).json({ message: 'Item removed' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
};
