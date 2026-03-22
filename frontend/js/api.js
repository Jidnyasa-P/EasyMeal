// frontend/js/api.js
const API_BASE = 'http://localhost:3001/api';

const API = {
  // Auth
  login:    `${API_BASE}/auth/login`,
  register: `${API_BASE}/auth/register`,

  // Menu
  menu:     `${API_BASE}/menu`,
  menuAll:  `${API_BASE}/menu/all`,
  menuItem: (id) => `${API_BASE}/menu/${id}`,

  // Orders
  orders:             `${API_BASE}/orders`,
  orderById:          (id)    => `${API_BASE}/orders/${id}`,
  // Use query-param style for emails — avoids encodeURIComponent double-encoding issues
  ordersByStudent:    (email) => `${API_BASE}/orders/student?email=${encodeURIComponent(email)}`,
  studentOrderItems:  (email) => `${API_BASE}/orders/student/items?email=${encodeURIComponent(email)}`,
  updateOrderStatus:  (id)    => `${API_BASE}/orders/${id}/status`,

  // Admin
  adminStats:   `${API_BASE}/admin/stats`,
  orderHistory: `${API_BASE}/orders/history`,
  analytics:    `${API_BASE}/analytics`,
};

// ── Session helpers ───────────────────────────────────────────────────────────
function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem('easymeal_user') || 'null'); }
  catch { return null; }
}
function setCurrentUser(user)  { sessionStorage.setItem('easymeal_user', JSON.stringify(user)); }
function clearCurrentUser()    { sessionStorage.removeItem('easymeal_user'); }

// ── Cart helpers ──────────────────────────────────────────────────────────────
function getCart()       { try { return JSON.parse(localStorage.getItem('easymealCart') || '[]'); } catch { return []; } }
function setCart(cart)   { localStorage.setItem('easymealCart', JSON.stringify(cart)); }
function clearCart()     { localStorage.removeItem('easymealCart'); }

// ── UI helpers ────────────────────────────────────────────────────────────────
function showAlert(selector, type, message) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.className = `alert alert-${type} mt-3`;
  el.textContent = message;
  el.classList.remove('d-none');
}
