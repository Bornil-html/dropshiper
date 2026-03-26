const { query } = require('../../utils/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../../utils/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ message: 'Email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role',
      [name, email, hash]
    );

    const user = result.rows[0];
    const token = generateToken(user);
    
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
