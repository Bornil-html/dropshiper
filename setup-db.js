require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setup() {
  try {
    console.log('Creating tables...');
    await pool.query(`
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
    console.log('Tables created successfully.');

    // Create Admin User
    const adminEmail = 'admin@dropship.com';
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)', 
        ['Admin', adminEmail, hashedPassword, 'admin']);
      console.log('Admin user created (admin@dropship.com / admin123).');
    }

    // Seed products if empty
    const prodRes = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(prodRes.rows[0].count) === 0) {
      const seedProducts = [
        { name: "iPhone 15 Pro Max", desc: "Titanium design, A17 Pro chip.", price: 1199.99, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569", cat: "Smartphones", feat: true },
        { name: "Samsung Galaxy S24 Ultra", desc: "AI features, Titanium frame.", price: 1299.99, image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf", cat: "Smartphones", feat: true },
        { name: "iPad Pro 12.9", desc: "M2 chip, Liquid Retina XDR display.", price: 1099.00, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0", cat: "Tablets", feat: false },
        { name: "AirPods Pro 2", desc: "Active Noise Cancellation.", price: 249.00, image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434", cat: "Headphones", feat: true },
        { name: "Sony WH-1000XM5", desc: "Industry leading noise cancellation.", price: 398.00, image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb", cat: "Headphones", feat: false },
        { name: "MagSafe Charger", desc: "Fast wireless charging.", price: 39.00, image: "https://images.unsplash.com/photo-1615526675159-e248c3021d3f", cat: "Accessories", feat: false }
      ];

      for (let p of seedProducts) {
        await pool.query(
          'INSERT INTO products (name, description, price, image_url, category, is_featured) VALUES ($1, $2, $3, $4, $5, $6)',
          [p.name, p.desc, p.price, p.image, p.cat, p.feat]
        );
      }
      console.log('Seed products added.');
    } else {
      console.log('Products already exist. Skipping seed.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error setting up DB:', err);
    process.exit(1);
  }
}

setup();
