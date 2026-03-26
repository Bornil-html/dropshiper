const { query } = require('../utils/db');
const { verifyToken } = require('../utils/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

  let user;
  try {
    user = verifyToken(req);
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const orders = await query(`
      SELECT o.id, o.total_price, o.status, o.created_at,
             json_agg(json_build_object(
               'product_name', p.name,
               'quantity', oi.quantity,
               'price', oi.price,
               'image_url', p.image_url
             )) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [user.id]);

    return res.status(200).json(orders.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
