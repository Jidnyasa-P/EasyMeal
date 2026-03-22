// backend/server.js — EasyMeal (fully fixed, port 3001)
const express = require('express');
const cors    = require('cors');
require('dotenv').config();
const db = require('./db');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'], optionsSuccessStatus: 200 }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => { console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`); next(); });

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', message: 'EasyMeal API running 🍽️' }));

// ── DB test (open in browser to verify DB works) ──────────────────────────────
app.get('/api/test', async (_req, res) => {
  try {
    const [[r1]] = await db.execute('SELECT COUNT(*) AS orders FROM orders');
    const [[r2]] = await db.execute('SELECT COUNT(*) AS items  FROM order_items');
    const [[r3]] = await db.execute('SELECT COUNT(*) AS menu   FROM menu_items');
    res.json({ success: true, db: 'connected', orders: r1.orders, order_items: r2.items, menu_items: r3.menu });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Analytics test (diagnose exactly which query fails) ───────────────────────
app.get('/api/analytics/test', async (_req, res) => {
  const results = {};
  try { const [r] = await db.execute('SELECT COUNT(*) AS c FROM order_items'); results.order_items = r[0].c; } catch(e) { results.order_items_err = e.message; }
  try { const [r] = await db.execute('SELECT COUNT(*) AS c FROM menu_items');  results.menu_items  = r[0].c; } catch(e) { results.menu_items_err  = e.message; }
  try {
    const [r] = await db.execute(`SELECT oi.item_name, SUM(oi.quantity) AS total_qty FROM order_items oi JOIN orders o ON o.id = oi.order_id GROUP BY oi.item_name LIMIT 3`);
    results.item_stats_sample = r;
  } catch(e) { results.item_stats_err = e.message; }
  try {
    const [r] = await db.execute(`SELECT mi.category, SUM(oi.quantity) AS total_qty FROM order_items oi JOIN menu_items mi ON mi.name = oi.item_name JOIN orders o ON o.id = oi.order_id GROUP BY mi.category`);
    results.cat_break = r;
  } catch(e) { results.cat_break_err = e.message; }
  try {
    const [r] = await db.execute(`SELECT student_name, COUNT(*) AS orders, SUM(total_amount) AS spent FROM orders GROUP BY student_email ORDER BY spent DESC LIMIT 3`);
    results.top_students = r;
  } catch(e) { results.top_students_err = e.message; }
  res.json({ success: true, results });
});

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });
  try {
    const [rows] = await db.execute('SELECT id, name, email, role FROM users WHERE email = ? AND password = ?', [email.trim(), password.trim()]);
    if (!rows.length) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    const user = rows[0];
    if (role && user.role !== role) return res.status(403).json({ success: false, message: `This account is not registered as ${role}.` });
    res.json({ success: true, message: 'Login successful!', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { console.error('Login error:', err); res.status(500).json({ success: false, message: 'Server error.' }); }
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  try {
    const [ex] = await db.execute('SELECT id FROM users WHERE email = ?', [email.trim()]);
    if (ex.length) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    const [r] = await db.execute('INSERT INTO users (name, email, phone, password, role) VALUES (?,?,?,?,?)', [name.trim(), email.trim(), phone||null, password.trim(), 'student']);
    res.status(201).json({ success: true, message: 'Account created!', user: { id: r.insertId, name: name.trim(), email: email.trim(), role: 'student' } });
  } catch (err) { console.error('Register error:', err); res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── Menu ──────────────────────────────────────────────────────────────────────
app.get('/api/menu', async (req, res) => {
  try {
    const { category } = req.query;
    let q = 'SELECT * FROM menu_items WHERE is_available = 1'; const p = [];
    if (category && category !== 'all') { q += ' AND category = ?'; p.push(category); }
    q += ' ORDER BY category, name';
    const [rows] = await db.execute(q, p);
    res.json({ success: true, data: rows });
  } catch (err) { console.error('Menu error:', err); res.status(500).json({ success: false, message: 'Failed to fetch menu.' }); }
});

app.get('/api/menu/all', async (_req, res) => {
  try { const [rows] = await db.execute('SELECT * FROM menu_items ORDER BY category, name'); res.json({ success: true, data: rows }); }
  catch (err) { res.status(500).json({ success: false, message: 'Failed to fetch menu.' }); }
});

app.post('/api/menu', async (req, res) => {
  const { name, category, price, description, image_url } = req.body;
  if (!name || !category || !price) return res.status(400).json({ success: false, message: 'Name, category and price are required.' });
  try {
    const [r] = await db.execute('INSERT INTO menu_items (name, category, price, description, image_url, is_available) VALUES (?,?,?,?,?,1)', [name.trim(), category, parseFloat(price), description||'', image_url||'']);
    const [item] = await db.execute('SELECT * FROM menu_items WHERE id = ?', [r.insertId]);
    res.status(201).json({ success: true, message: 'Menu item added!', data: item[0] });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to add menu item.' }); }
});

app.put('/api/menu/:id', async (req, res) => {
  const { id } = req.params; const { name, category, price, description, image_url, is_available } = req.body;
  try {
    await db.execute('UPDATE menu_items SET name=?,category=?,price=?,description=?,image_url=?,is_available=? WHERE id=?', [name, category, parseFloat(price), description||'', image_url||'', is_available?1:0, id]);
    res.json({ success: true, message: 'Menu item updated!' });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to update menu item.' }); }
});

app.delete('/api/menu/:id', async (req, res) => {
  const { id } = req.params;
  try { await db.execute('DELETE FROM menu_items WHERE id = ?', [id]); res.json({ success: true, message: 'Menu item deleted!' }); }
  catch (err) { res.status(500).json({ success: false, message: 'Failed to delete menu item.' }); }
});

// ── Orders — specific routes BEFORE /:id ─────────────────────────────────────
app.get('/api/orders', async (req, res) => {
  try {
    const { status } = req.query;
    let q = `SELECT o.id, o.order_code, o.student_name, o.student_email, o.total_amount, o.payment_method, o.status, o.created_at,
               GROUP_CONCAT(CONCAT(oi.item_name,' x',oi.quantity) ORDER BY oi.id SEPARATOR ', ') AS items_summary
             FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id`;
    const p = [];
    if (status && status !== 'all') { q += ' WHERE o.status = ?'; p.push(status); }
    q += ' GROUP BY o.id, o.order_code, o.student_name, o.student_email, o.total_amount, o.payment_method, o.status, o.created_at ORDER BY o.created_at DESC';
    const [rows] = await db.execute(q, p);
    res.json({ success: true, data: rows });
  } catch (err) { console.error('Orders error:', err); res.status(500).json({ success: false, message: 'Failed to fetch orders: ' + err.message }); }
});

app.get('/api/orders/history', async (req, res) => {
  try {
    const { from, to, student } = req.query;
    let q = `SELECT o.id, o.order_code, o.student_name, o.student_email, o.total_amount, o.payment_method, o.status, o.created_at,
               GROUP_CONCAT(CONCAT(oi.item_name,' x',oi.quantity) ORDER BY oi.id SEPARATOR ', ') AS items_summary
             FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id WHERE 1=1`;
    const p = [];
    if (from) { q += ' AND DATE(o.created_at) >= ?'; p.push(from); }
    if (to)   { q += ' AND DATE(o.created_at) <= ?'; p.push(to); }
    if (student && student.trim()) { q += ' AND (o.student_name LIKE ? OR o.student_email LIKE ?)'; p.push('%'+student.trim()+'%','%'+student.trim()+'%'); }
    q += ' GROUP BY o.id, o.order_code, o.student_name, o.student_email, o.total_amount, o.payment_method, o.status, o.created_at ORDER BY o.created_at DESC LIMIT 500';
    const [rows] = await db.execute(q, p);
    res.json({ success: true, data: rows });
  } catch (err) { console.error('History error:', err); res.status(500).json({ success: false, message: 'History failed: ' + err.message }); }
});

app.get('/api/orders/student/items', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ success: false, message: 'email param required.' });
  try {
    const [rows] = await db.execute(
      `SELECT oi.item_name,
              SUM(oi.quantity)    AS times_ordered,
              MAX(mi.price)       AS price,
              MAX(mi.category)    AS category,
              MAX(mi.image_url)   AS image_url,
              MAX(mi.description) AS description
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       LEFT JOIN menu_items mi ON mi.name = oi.item_name
       WHERE o.student_email = ?
       GROUP BY oi.item_name
       ORDER BY times_ordered DESC`, [email]);
    res.json({ success: true, data: rows });
  } catch (err) { console.error('Student items error:', err); res.status(500).json({ success: false, message: 'Failed: ' + err.message }); }
});

app.get('/api/orders/student', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ success: false, message: 'email param required.' });
  try {
    const [rows] = await db.execute(
      `SELECT o.id, o.order_code, o.student_name, o.student_email, o.total_amount, o.payment_method, o.status, o.created_at,
              GROUP_CONCAT(CONCAT(oi.item_name,' x',oi.quantity) ORDER BY oi.id SEPARATOR ', ') AS items_summary
       FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.student_email = ?
       GROUP BY o.id, o.order_code, o.student_name, o.student_email, o.total_amount, o.payment_method, o.status, o.created_at
       ORDER BY o.created_at DESC LIMIT 10`, [email]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed: ' + err.message }); }
});

// MUST be last among GET /api/orders/*
app.get('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [order] = await db.execute('SELECT * FROM orders WHERE id = ? OR order_code = ?', [id, id]);
    if (!order.length) return res.status(404).json({ success: false, message: 'Order not found.' });
    const [items] = await db.execute('SELECT * FROM order_items WHERE order_id = ?', [order[0].id]);
    res.json({ success: true, data: { ...order[0], items } });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to fetch order.' }); }
});

app.post('/api/orders', async (req, res) => {
  const { student_name, student_email, items, payment_method } = req.body;
  if (!student_name || !student_email || !items || !items.length) return res.status(400).json({ success: false, message: 'Missing required order details.' });
  try {
    const orderCode   = 'EM' + Date.now().toString().slice(-6);
    const totalAmount = items.reduce((s,i) => s + i.price * i.qty, 0);
    const [r] = await db.execute('INSERT INTO orders (order_code, student_name, student_email, total_amount, payment_method, status) VALUES (?,?,?,?,?,?)',
      [orderCode, student_name.trim(), student_email.trim(), totalAmount, payment_method||'cod', 'pending']);
    const orderId = r.insertId;
    for (const item of items)
      await db.execute('INSERT INTO order_items (order_id, item_name, price, quantity, subtotal) VALUES (?,?,?,?,?)',
        [orderId, item.name, item.price, item.qty, item.price * item.qty]);
    res.status(201).json({ success: true, message: 'Order placed!', data: { order_id: orderId, order_code: orderCode, total_amount: totalAmount, status: 'pending' } });
  } catch (err) { console.error('Place order error:', err); res.status(500).json({ success: false, message: 'Failed to place order.' }); }
});

app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params; const { status } = req.body;
  if (!['pending','ready'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
  try { await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]); res.json({ success: true, message: `Status updated to ${status}` }); }
  catch (err) { res.status(500).json({ success: false, message: 'Failed to update status.' }); }
});

app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try { await db.execute('DELETE FROM orders WHERE id = ?', [id]); res.json({ success: true, message: 'Order deleted.' }); }
  catch (err) { res.status(500).json({ success: false, message: 'Failed to delete order.' }); }
});

// ── Admin Stats ───────────────────────────────────────────────────────────────
app.get('/api/admin/stats', async (_req, res) => {
  try {
    const [[{total}]]   = await db.execute('SELECT COUNT(*) AS total FROM orders');
    const [[{pending}]] = await db.execute("SELECT COUNT(*) AS pending FROM orders WHERE status='pending'");
    const [[{ready}]]   = await db.execute("SELECT COUNT(*) AS ready FROM orders WHERE status='ready'");
    const [[{revenue}]] = await db.execute("SELECT IFNULL(SUM(total_amount),0) AS revenue FROM orders");
    res.json({ success: true, data: { total_orders:total, pending_orders:pending, ready_orders:ready, total_revenue:revenue } });
  } catch (err) { console.error('Stats error:', err); res.status(500).json({ success: false, message: 'Failed to fetch stats.' }); }
});

// ── Analytics ─────────────────────────────────────────────────────────────────
// Each query gets its OWN fresh params array + fully explicit GROUP BY (MySQL 8 ONLY_FULL_GROUP_BY safe)
app.get('/api/analytics', async (req, res) => {
  try {
    const { from, to } = req.query;

    // Helper: returns { where, params } freshly each call
    const dateFilter = () => {
      const parts = [], p = [];
      if (from) { parts.push('DATE(o.created_at) >= ?'); p.push(from); }
      if (to)   { parts.push('DATE(o.created_at) <= ?'); p.push(to); }
      return { where: parts.length ? ' AND ' + parts.join(' AND ') : '', params: p };
    };

    // 1 — Item stats (safe: GROUP BY only the SELECT non-aggregate)
    const f1 = dateFilter();
    const [itemStats] = await db.execute(
      `SELECT oi.item_name,
              SUM(oi.quantity)            AS total_qty,
              COUNT(DISTINCT oi.order_id) AS order_count,
              SUM(oi.subtotal)            AS total_revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE 1=1${f1.where}
       GROUP BY oi.item_name
       ORDER BY total_qty DESC`,
      f1.params
    );

    // 2 — Daily orders last 14 days (no date params needed)
    const [dailyOrders] = await db.execute(
      `SELECT DATE(created_at) AS date,
              COUNT(*)          AS order_count,
              SUM(total_amount) AS revenue
       FROM orders
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    // 3 — Category breakdown (safe GROUP BY)
    const f3 = dateFilter();
    const [catBreak] = await db.execute(
      `SELECT mi.category,
              SUM(oi.quantity) AS total_qty
       FROM order_items oi
       JOIN menu_items mi ON mi.name = oi.item_name
       JOIN orders     o  ON o.id   = oi.order_id
       WHERE 1=1${f3.where}
       GROUP BY mi.category`,
      f3.params
    );

    // 4 — Top students (safe: GROUP BY student_email, select student_name via ANY_VALUE for MySQL 8)
    const f4 = dateFilter();
    const [topStudents] = await db.execute(
      `SELECT ANY_VALUE(student_name) AS student_name,
              student_email,
              COUNT(*)                AS orders,
              SUM(total_amount)       AS spent
       FROM orders o
       WHERE 1=1${f4.where}
       GROUP BY student_email
       ORDER BY spent DESC
       LIMIT 5`,
      f4.params
    );

    res.json({ success: true, data: { itemStats, dailyOrders, catBreak, topStudents } });

  } catch (err) {
    console.error('❌ Analytics error:', err.message);
    res.status(500).json({ success: false, message: 'Analytics failed: ' + err.message });
  }
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.url} not found.` }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n🍽️  EasyMeal Backend Server');
  console.log('================================');
  console.log(`🚀  http://localhost:${PORT}`);
  console.log(`📡  API: http://localhost:${PORT}/api`);
  console.log(`🔧  DB test:        http://localhost:${PORT}/api/test`);
  console.log(`🔧  Analytics test: http://localhost:${PORT}/api/analytics/test`);
  console.log('================================\n');
});
