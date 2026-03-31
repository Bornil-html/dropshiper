// API Utility functions

const API_BASE = '/api';

async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data;
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    // If the server crashes, it might return HTML (like a Vercel error page)
    const text = await response.text();
    console.error('Server returned non-JSON response:', text);
    throw new Error('The server did not return a valid JSON response. It might have crashed or not be configured for this endpoint.');
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'API request failed');
  }
  return data;
}

window.api = {
  // Auth
  login: (credentials) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  signup: (data) => fetchAPI('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  
  // Products
  getProducts: (query = '') => fetchAPI(`/products${query}`),
  getProduct: (id) => fetchAPI(`/products?id=${id}`),
  
  // Cart
  getCart: () => fetchAPI('/cart'),
  addToCart: (productId, quantity = 1) => fetchAPI('/cart', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  removeFromCart: (itemId) => fetchAPI(`/cart?itemId=${itemId}`, { method: 'DELETE' }),
  clearCart: () => fetchAPI('/cart?clean=true', { method: 'DELETE' }),

  // Checkout & Orders
  checkout: (paymentDetails) => fetchAPI('/checkout', { method: 'POST', body: JSON.stringify(paymentDetails) }),
  getOrders: () => fetchAPI('/orders'),

  // Admin
  adminGetProducts: () => fetchAPI('/admin/products'),
  adminAddProduct: (data) => fetchAPI('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateProduct: (id, data) => fetchAPI(`/admin/products?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteProduct: (id) => fetchAPI(`/admin/products?id=${id}`, { method: 'DELETE' }),
  adminGetOrders: () => fetchAPI('/admin/orders'),
  adminUpdateOrderStatus: (id, status) => fetchAPI(`/admin/orders?id=${id}`, { method: 'PUT', body: JSON.stringify({ status }) })
};

// UI Utils
function showToast(message, isError = false) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  if (isError) toast.style.backgroundColor = 'var(--error)';

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

window.showToast = showToast;

function updateNav() {
  const userStr = localStorage.getItem('user');
  const navLinks = document.getElementById('nav-links');
  if (!navLinks) return;

  if (userStr) {
    const user = JSON.parse(userStr);
    let linksHtml = `
      <a href="/products.html">Store</a>
      <a href="/cart.html">Cart</a>
      <a href="/orders.html">Orders</a>
    `;
    if (user.role === 'admin') {
      linksHtml += `<a href="/admin.html">Admin</a>`;
    }
    linksHtml += `<a href="#" onclick="logout()">Logout</a>`;
    navLinks.innerHTML = linksHtml;
  } else {
    navLinks.innerHTML = `
      <a href="/products.html">Store</a>
      <a href="/login.html">Sign In</a>
      <a href="/signup.html" class="button" style="padding: 8px 16px">Sign Up</a>
    `;
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  updateNav();
});
