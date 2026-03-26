const { query } = require('../../utils/db');
const { verifyToken } = require('../../utils/auth');

module.exports = async (req, res) => {
  let user;
  try {
    user = verifyToken(req);
    if (user.role !== 'admin') throw new Error('Not admin');
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized - Admin Only' });
  }

  if (req.method === 'GET') {
    try {
      const result = await query('SELECT * FROM products ORDER BY created_at DESC');
      return res.status(200).json(result.rows);
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
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
      console.log(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'Missing product ID' });
    
    try {
      await query('DELETE FROM products WHERE id = $1', [id]);
      return res.status(200).json({ message: 'Product deleted' });
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
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
      return res.status(500).json({ message: 'Server error' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
};
