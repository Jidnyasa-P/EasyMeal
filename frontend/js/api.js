// frontend/js/api.js
// Central API configuration - change BASE_URL if your backend runs on a different port
const API_BASE = 'http://localhost:3000/api';

const API = {
  // Auth
  login: `${API_BASE}/auth/login`,
  register: `${API_BASE}/auth/register`,

  // Menu
  menu: `${API_BASE}/menu`,
  menuAll: `${API_BASE}/menu/all`,
  menuItem: (id) => `${API_BASE}/menu/${id}`,

  // Orders
  orders: `${API_BASE}/orders`,
  orderById: (id) => `${API_BASE}/orders/${id}`,
  ordersByStudent: (email) => `${API_BASE}/orders/student/${encodeURIComponent(email)}`,
  updateOrderStatus: (id) => `${API_BASE}/orders/${id}/status`,

  // Admin
  adminStats: `${API_BASE}/admin/stats`,
};

// Helper: Get current logged-in user from session
function getCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem('easymeal_user') || 'null');
  } catch { return null; }
}

// Helper: Set user session
function setCurrentUser(user) {
  sessionStorage.setItem('easymeal_user', JSON.stringify(user));
}

// Helper: Clear user session
function clearCurrentUser() {
  sessionStorage.removeItem('easymeal_user');
}

// Helper: Cart
function getCart() {
  try { return JSON.parse(localStorage.getItem('easymealCart') || '[]'); }
  catch { return []; }
}
function setCart(cart) {
  localStorage.setItem('easymealCart', JSON.stringify(cart));
}
function clearCart() {
  localStorage.removeItem('easymealCart');
}

// Helper: Show alert
function showAlert(selector, type, message) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.className = `alert alert-${type} mt-3`;
  el.textContent = message;
  el.classList.remove('d-none');
}
