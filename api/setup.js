const bcrypt = require('bcryptjs');
const { query } = require('../utils/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
  
  const { key } = req.query;
  if (key !== 'setup123') return res.status(401).json({ message: 'Unauthorized' });

  try {
    console.log('Creating tables...');
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image_url VARCHAR(255),
        category VARCHAR(50) NOT NULL,
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        total_price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Success',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL
      );
    `);

    // Add/Update Admin forcefully (hashed 'admin123')
    const adminEmail = 'admin@dropship.com';
    const hash = await bcrypt.hash('admin123', 10);
    const existing = await query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    if (existing.rows.length === 0) {
      await query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)', 
        ['Admin', adminEmail, hash, 'admin']);
      console.log('Admin user created.');
    } else {
      await query('UPDATE users SET password = $1, role = $2 WHERE email = $3', 
        [hash, 'admin', adminEmail]);
      console.log('Admin user updated.');
    }

    // Seed products
    const prodCount = await query('SELECT COUNT(*) FROM products');
    if (parseInt(prodCount.rows[0].count) === 0) {
      const seedProducts = [
        { name: "iPhone 15 Pro Max", desc: "Titanium design, A17 Pro chip.", price: 1199.99, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569", cat: "Smartphones", feat: true },
        { name: "Samsung Galaxy S24 Ultra", desc: "AI features, Titanium frame.", price: 1299.99, image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf", cat: "Smartphones", feat: true },
        { name: "AirPods Pro 2", desc: "Active Noise Cancellation.", price: 249.00, image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434", cat: "Headphones", feat: true }
      ];
      for (let p of seedProducts) {
        await query(
          'INSERT INTO products (name, description, price, image_url, category, is_featured) VALUES ($1, $2, $3, $4, $5, $6)',
          [p.name, p.desc, p.price, p.image, p.cat, p.feat]
        );
      }
    }

    return res.status(200).json({ message: 'Database setup successful!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Setup failed', error: err.message });
  }
};
