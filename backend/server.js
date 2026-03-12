// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================
// MIDDLEWARE
// ========================
app.use(cors({
  origin: '*', // Allow all origins for local development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ========================
// HEALTH CHECK
// ========================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EasyMeal API is running 🍽️' });
});

// ========================
// AUTH ROUTES
// ========================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, role FROM users WHERE email = ? AND password = ?',
      [email.trim(), password.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];

    // Check role if provided
    if (role && user.role !== role) {
      return res.status(403).json({ success: false, message: `This account is not registered as ${role}.` });
    }

    res.json({
      success: true,
      message: 'Login successful!',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }

  try {
    // Check if email already exists
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const [result] = await db.execute(
      'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.trim(), phone || null, password.trim(), 'student']
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: { id: result.insertId, name: name.trim(), email: email.trim(), role: 'student' }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ========================
// MENU ROUTES
// ========================

// GET /api/menu - Get all available menu items
app.get('/api/menu', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM menu_items WHERE is_available = 1';
    const params = [];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY category, name';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Menu fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch menu.' });
  }
});

// GET /api/menu/all - Admin: Get all menu items (including unavailable)
app.get('/api/menu/all', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM menu_items ORDER BY category, name');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch menu.' });
  }
});

// POST /api/menu - Admin: Add new menu item
app.post('/api/menu', async (req, res) => {
  const { name, category, price, description, image_url } = req.body;

  if (!name || !category || !price) {
    return res.status(400).json({ success: false, message: 'Name, category and price are required.' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO menu_items (name, category, price, description, image_url, is_available) VALUES (?, ?, ?, ?, ?, 1)',
      [name.trim(), category, parseFloat(price), description || '', image_url || '']
    );

    const [newItem] = await db.execute('SELECT * FROM menu_items WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Menu item added!', data: newItem[0] });
  } catch (err) {
    console.error('Add menu error:', err);
    res.status(500).json({ success: false, message: 'Failed to add menu item.' });
  }
});

// PUT /api/menu/:id - Admin: Update menu item
app.put('/api/menu/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, price, description, image_url, is_available } = req.body;

  try {
    await db.execute(
      'UPDATE menu_items SET name=?, category=?, price=?, description=?, image_url=?, is_available=? WHERE id=?',
      [name, category, parseFloat(price), description || '', image_url || '', is_available ? 1 : 0, id]
    );
    res.json({ success: true, message: 'Menu item updated!' });
  } catch (err) {
    console.error('Update menu error:', err);
    res.status(500).json({ success: false, message: 'Failed to update menu item.' });
  }
});

// DELETE /api/menu/:id - Admin: Delete menu item
app.delete('/api/menu/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM menu_items WHERE id = ?', [id]);
    res.json({ success: true, message: 'Menu item deleted!' });
  } catch (err) {
    console.error('Delete menu error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete menu item.' });
  }
});

// ========================
// ORDER ROUTES
// ========================

// GET /api/orders - Admin: Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT o.*, GROUP_CONCAT(CONCAT(oi.item_name, ' x', oi.quantity) SEPARATOR ', ') AS items_summary
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' WHERE o.status = ?';
      params.push(status);
    }

    query += ' GROUP BY o.id ORDER BY o.created_at DESC';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Fetch orders error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

// GET /api/orders/student/:email - Get orders for a specific student
app.get('/api/orders/student/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM orders WHERE student_email = ? ORDER BY created_at DESC LIMIT 10',
      [email]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch student orders.' });
  }
});

// GET /api/orders/:id - Get single order with items
app.get('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [order] = await db.execute('SELECT * FROM orders WHERE id = ? OR order_code = ?', [id, id]);
    if (order.length === 0) return res.status(404).json({ success: false, message: 'Order not found.' });

    const [items] = await db.execute('SELECT * FROM order_items WHERE order_id = ?', [order[0].id]);
    res.json({ success: true, data: { ...order[0], items } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch order.' });
  }
});

// POST /api/orders - Place a new order
app.post('/api/orders', async (req, res) => {
  const { student_name, student_email, items, payment_method } = req.body;

  if (!student_name || !student_email || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Missing required order details.' });
  }

  try {
    // Generate unique order code
    const orderCode = 'EM' + Date.now().toString().slice(-6);
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Insert order
    const [orderResult] = await db.execute(
      'INSERT INTO orders (order_code, student_name, student_email, total_amount, payment_method, status) VALUES (?, ?, ?, ?, ?, ?)',
      [orderCode, student_name.trim(), student_email.trim(), totalAmount, payment_method || 'cod', 'pending']
    );

    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of items) {
      await db.execute(
        'INSERT INTO order_items (order_id, item_name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.name, item.price, item.qty, item.price * item.qty]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: { order_id: orderId, order_code: orderCode, total_amount: totalAmount, status: 'pending' }
    });
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ success: false, message: 'Failed to place order.' });
  }
});

// PUT /api/orders/:id/status - Admin: Update order status
app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'ready'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value.' });
  }

  try {
    await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
});

// DELETE /api/orders/:id - Admin: Delete an order
app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('DELETE FROM orders WHERE id = ?', [id]);
    res.json({ success: true, message: 'Order deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete order.' });
  }
});

// ========================
// ADMIN STATS
// ========================
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [[{ total }]] = await db.execute('SELECT COUNT(*) AS total FROM orders');
    const [[{ pending }]] = await db.execute("SELECT COUNT(*) AS pending FROM orders WHERE status = 'pending'");
    const [[{ ready }]] = await db.execute("SELECT COUNT(*) AS ready FROM orders WHERE status = 'ready'");
    const [[{ revenue }]] = await db.execute("SELECT IFNULL(SUM(total_amount),0) AS revenue FROM orders");

    res.json({
      success: true,
      data: { total_orders: total, pending_orders: pending, ready_orders: ready, total_revenue: revenue }
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// ========================
// 404 HANDLER
// ========================
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.url} not found.` });
});

// ========================
// START SERVER
// ========================
app.listen(PORT, () => {
  console.log('');
  console.log('🍽️  EasyMeal Backend Server');
  console.log('================================');
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
  console.log(`📡 API base URL:      http://localhost:${PORT}/api`);
  console.log('================================');
  console.log('Available routes:');
  console.log('  GET  /api/health');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/register');
  console.log('  GET  /api/menu');
  console.log('  POST /api/menu  (admin)');
  console.log('  GET  /api/orders');
  console.log('  POST /api/orders');
  console.log('  GET  /api/admin/stats');
  console.log('================================');
});
