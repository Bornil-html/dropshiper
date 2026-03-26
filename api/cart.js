const { query } = require('../utils/db');
const { verifyToken } = require('../utils/auth');

module.exports = async (req, res) => {
  let user;
  try {
    user = verifyToken(req);
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
      return res.status(500).json({ message: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ message: 'Missing product_id' });

    try {
      const check = await query('SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2', [user.id, productId]);
      if (check.rows.length > 0) {
        // update qty
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
      return res.status(500).json({ message: 'Server error' });
    }
  }

  if (req.method === 'DELETE') {
    const { itemId, clean } = req.query; // itemId is the cart_item_id

    try {
      if (clean === 'true') {
        const result = await query('DELETE FROM cart_items WHERE user_id = $1 RETURNING *', [user.id]);
        return res.status(200).json({ message: 'Cart cleared' });
      }

      if (!itemId) return res.status(400).json({ message: 'Missing itemId' });
      
      const result = await query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *', [itemId, user.id]);
      if (result.rows.length === 0) return res.status(404).json({ message: 'Item not found' });
      
      return res.status(200).json({ message: 'Item removed' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
};
