/**
 * HUBOOZE API CLIENT
 * Replaces all in-memory mock data with real backend calls.
 * Base URL auto-detects dev vs production.
 */

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/api';

class HuboozeAPI {
  constructor() {
    this.token = localStorage.getItem('hb_token') || null;
  }

  // ── Core fetch wrapper ──────────────────────────────────────────
  async request(method, path, body = null, opts = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
      const res  = await fetch(`${API_BASE}${path}`, config);
      const data = await res.json();

      if (!res.ok) {
        throw new APIError(data.error || `HTTP ${res.status}`, res.status);
      }
      return data;
    } catch (err) {
      if (err instanceof APIError) throw err;
      throw new APIError('Network error — check your connection or server.', 0);
    }
  }

  get  = (path)         => this.request('GET',    path);
  post = (path, body)   => this.request('POST',   path, body);
  put  = (path, body)   => this.request('PUT',    path, body);
  patch= (path, body)   => this.request('PATCH',  path, body);
  del  = (path)         => this.request('DELETE', path);

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('hb_token', token);
    else       localStorage.removeItem('hb_token');
  }

  // ── AUTH ─────────────────────────────────────────────────────────
  async register(data)         { const r = await this.post('/auth/register', data);    this.setToken(r.token); return r; }
  async login(email, password) { const r = await this.post('/auth/login', {email, password}); this.setToken(r.token); return r; }
  async sendOTP(email)         { return this.post('/auth/send-otp', { email }); }
  async verifyOTP(email, otp)  { const r = await this.post('/auth/verify-otp', { email, otp }); this.setToken(r.token); return r; }
  async getMe()                { return this.get('/auth/me'); }
  async updateProfile(data)    { return this.put('/auth/profile', data); }
  async addAddress(addr)       { return this.post('/auth/addresses', addr); }
  async updateNotifPrefs(prefs){ return this.put('/auth/notif-prefs', prefs); }
  logout()                     { this.setToken(null); }

  // ── PRODUCTS ─────────────────────────────────────────────────────
  async getProducts(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.get(`/products${q ? '?' + q : ''}`);
  }
  async getProduct(id)              { return this.get(`/products/${id}`); }
  async createProduct(data)         { return this.post('/products', data); }
  async updateProduct(id, data)     { return this.put(`/products/${id}`, data); }
  async addReview(productId, data)  { return this.post(`/products/${productId}/reviews`, data); }

  // ── ORDERS ────────────────────────────────────────────────────────
  async getOrders(params = {})      { return this.get(`/orders?${new URLSearchParams(params)}`); }
  async getOrder(id)                { return this.get(`/orders/${id}`); }
  async placeOrder(data)            { return this.post('/orders', data); }
  async cancelOrder(id, reason)     { return this.patch(`/orders/${id}/cancel`, { reason }); }
  async updateOrderStatus(id, data) { return this.patch(`/orders/${id}/status`, data); }
  async getAllOrders(params = {})    { return this.get(`/orders/admin/all?${new URLSearchParams(params)}`); }
  async validateCoupon(code, subtotal) { return this.post('/orders/validate-coupon', { code, subtotal }); }

  // ── RETURNS ───────────────────────────────────────────────────────
  async getReturns()                { return this.get('/returns'); }
  async initiateReturn(data)        { return this.post('/returns', data); }
  async approveReturn(id)           { return this.patch(`/returns/${id}/approve`); }
  async rejectReturn(id, reason)    { return this.patch(`/returns/${id}/reject`, { reason }); }
  async getAllReturns(params = {})   { return this.get(`/returns/admin/all?${new URLSearchParams(params)}`); }

  // ── SELLER ────────────────────────────────────────────────────────
  async getSellerDashboard()        { return this.get('/seller/dashboard'); }
  async getSellerProducts()         { return this.get('/seller/products'); }
  async getSellerOrders(params={})  { return this.get(`/seller/orders?${new URLSearchParams(params)}`); }
  async getSellerPayouts()          { return this.get('/seller/payouts'); }

  // ── ADMIN ─────────────────────────────────────────────────────────
  async getAdminStats()             { return this.get('/admin/stats'); }
  async getAdminUsers(params={})    { return this.get(`/admin/users?${new URLSearchParams(params)}`); }
  async updateUserRole(id, role)    { return this.patch(`/admin/users/${id}/role`, { role }); }
  async toggleProduct(id)           { return this.patch(`/admin/products/${id}/toggle`); }
  async getAnalytics()              { return this.get('/admin/analytics'); }

  // ── NOTIFICATIONS ─────────────────────────────────────────────────
  async getNotifications(params={}) { return this.get(`/notifications?${new URLSearchParams(params)}`); }
  async markAllRead()               { return this.patch('/notifications/read-all'); }
  async markRead(id)                { return this.patch(`/notifications/${id}/read`); }

  // ── HEALTH ────────────────────────────────────────────────────────
  async health()                    { return this.get('/health'); }
}

class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.name   = 'APIError';
    this.status = status;
  }
}

// Singleton instance
const api = new HuboozeAPI();
window.api = api;

// Helper: wrap API calls with error toast
async function apiCall(fn, successMsg = null) {
  try {
    const result = await fn();
    if (successMsg) showToast(successMsg, 'success');
    return result;
  } catch (err) {
    console.error('API Error:', err.message);
    showToast(err.message || 'Something went wrong', 'error');
    if (err.status === 401) {
      // Token expired — log out
      api.logout();
      currentUser = null;
      updateHeaderAuth();
      showPage('account');
    }
    return null;
  }
}

window.apiCall = apiCall;
