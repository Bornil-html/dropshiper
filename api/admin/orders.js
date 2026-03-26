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
      const result = await query(`
        SELECT o.id, o.user_id, u.name as user_name, u.email as user_email, 
               o.total_price, o.status, o.created_at,
               json_agg(json_build_object(
                 'product_name', p.name,
                 'quantity', oi.quantity,
                 'price', oi.price
               )) as items
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        GROUP BY o.id, u.id
        ORDER BY o.created_at DESC
      `);
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // Optional: Update status
  if (req.method === 'PUT') {
    const { id } = req.query;
    const { status } = req.body;
    try {
      if (!id || !status) return res.status(400).json({ message: 'Missing fields' });
      await query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
      return res.status(200).json({ message: 'Status updated' });
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
};
