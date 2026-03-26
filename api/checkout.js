const { query } = require('../utils/db');
const { verifyToken } = require('../utils/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  let user;
  try {
    user = verifyToken(req);
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // FAKE PAYMENT LOGIC
  const { cardNumber, cardName, expiry, cvv, totalPrice } = req.body;
  if (!cardNumber || !cardName || !expiry || !cvv || !totalPrice) {
    return res.status(400).json({ message: 'Incomplete payment details' });
  }

  // Fake processing delay
  await new Promise(r => setTimeout(r, 1500)); 

  try {
    // 1. Get user cart
    const cart = await query(`
      SELECT c.quantity, p.id as product_id, p.price 
      FROM cart_items c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = $1
    `, [user.id]);

    if (cart.rows.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // 2. Create Order
    const dbTotal = cart.rows.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // insert order
    const orderRes = await query(
      'INSERT INTO orders (user_id, total_price, status) VALUES ($1, $2, $3) RETURNING id',
      [user.id, dbTotal, 'Success']
    );
    const orderId = orderRes.rows[0].id;

    // insert order items
    for (let item of cart.rows) {
      await query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    // 3. Clear cart
    await query('DELETE FROM cart_items WHERE user_id = $1', [user.id]);

    return res.status(200).json({ 
      message: 'Payment Successful', 
      orderId 
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error during checkout' });
  }
};
