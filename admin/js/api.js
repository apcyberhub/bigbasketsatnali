/**
 * ==============================================================================
 * BIG BASKET ADMIN - REST API CLIENT WRAPPER
 * ==============================================================================
 */

const AdminAPI = (function () {
  const apiHost = (window.location.hostname && window.location.hostname !== '') ? window.location.hostname : '127.0.0.1';
  const BASE_URL = (window.location.port === '8000')
    ? `${window.location.protocol}//${window.location.host}/api`
    : `http://${apiHost}:8000/api`;

  function getToken() {
    return localStorage.getItem('bigbasket_auth_token') || sessionStorage.getItem('bigbasket_auth_token');
  }

  async function request(endpoint, options = {}) {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      let data = null;
      try {
        data = await response.json();
      } catch (jsonErr) {
        // Not a JSON response
      }

      if (response.status === 401) {
        localStorage.removeItem('bigbasket_auth_token');
        sessionStorage.removeItem('bigbasket_auth_token');
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: data?.error?.message || 'Authentication required. Please login again.'
          }
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: data?.error?.message || "You don't have permission."
          }
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: data?.error?.message || 'Product API endpoint not found.'
          }
        };
      }

      if (response.status === 422) {
        const details = data?.error?.details
          ? (Array.isArray(data.error.details) ? data.error.details.join(', ') : data.error.details)
          : null;
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: details ? `Please check the product information: ${details}` : (data?.error?.message || 'Please check the product information.')
          }
        };
      }

      if (response.status >= 500) {
        return {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: data?.error?.message || 'Server error while creating product.'
          }
        };
      }

      if (data) {
        return data;
      }

      return {
        success: response.ok,
        error: response.ok ? null : { code: `HTTP_${response.status}`, message: `Request failed with status ${response.status}` }
      };
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Could not connect to backend server. Make sure the backend is running.' }
      };
    }
  }

  return {
    // 1. Dashboard Stats
    async getDashboardStats() {
      return request('/admin/dashboard/stats');
    },

    // 2. Products
    async getProducts(params = {}) {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/products?${query}`);
    },

    async getProduct(id) {
      return request(`/admin/products/${id}`);
    },

    async createProduct(data) {
      return request('/admin/products', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async updateProduct(id, data) {
      return request(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    async softDeleteProduct(id) {
      return request(`/admin/products/${id}`, {
        method: 'DELETE'
      });
    },

    async restoreProduct(id) {
      return request(`/admin/products/${id}/restore`, {
        method: 'PATCH'
      });
    },

    async uploadProductImage(file) {
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch(`${BASE_URL}/admin/products/upload-image`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: formData
        });

        let data = null;
        try {
          data = await res.json();
        } catch (jsonErr) {}

        if (res.status === 401) {
          return { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required. Please login again.' } };
        }
        if (res.status === 403) {
          return { success: false, error: { code: 'FORBIDDEN', message: "You don't have permission." } };
        }
        if (res.status === 404) {
          return { success: false, error: { code: 'NOT_FOUND', message: 'Upload image endpoint not found.' } };
        }
        if (res.status === 422) {
          return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Please check the uploaded image file.' } };
        }
        if (res.status >= 500) {
          return { success: false, error: { code: 'SERVER_ERROR', message: 'Server error while uploading image.' } };
        }

        if (data) {
          return data;
        }

        return {
          success: res.ok,
          error: res.ok ? null : { code: `HTTP_${res.status}`, message: `Image upload failed with status ${res.status}` }
        };
      } catch (err) {
        console.error('API Error on /admin/products/upload-image:', err);
        return {
          success: false,
          error: { code: 'NETWORK_ERROR', message: 'Could not connect to backend server. Make sure the backend is running.' }
        };
      }
    },

    // 3. Categories
    async getCategories() {
      const res = await request('/admin/categories');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res;
      }
      const pubRes = await request('/categories');
      if (pubRes && pubRes.success && Array.isArray(pubRes.data) && pubRes.data.length > 0) {
        return pubRes;
      }
      return res;
    },

    async getCategoryTree() {
      const res = await request('/admin/categories/tree');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res;
      }
      return await request('/categories/tree');
    },

    async getCategory(id) {
      return request(`/admin/categories/${id}`);
    },

    async createCategory(data) {
      return request('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async updateCategory(id, data) {
      return request(`/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    async deleteCategory(id) {
      return request(`/admin/categories/${id}`, {
        method: 'DELETE'
      });
    },

    async restoreCategory(id) {
      return request(`/admin/categories/${id}/restore`, {
        method: 'PATCH'
      });
    },

    // 4. Inventory
    async getInventory(params = {}) {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/inventory?${query}`);
    },

    async getLowStockProducts() {
      return request('/admin/inventory/low-stock');
    },

    async updateStock(productId, data) {
      return request(`/admin/inventory/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },

    async getInventoryTransactions(params = {}) {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/inventory/transactions?${query}`);
    },

    // 5. Orders
    async getOrders(params = {}) {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/orders?${query}`);
    },

    async getOrder(id) {
      return request(`/admin/orders/${id}`);
    },

    async updateOrderStatus(id, status, notes = '') {
      return request(`/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
      });
    },

    // 6. Customers
    async getCustomers(params = {}) {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/customers?${query}`);
    },

    async getCustomer(id) {
      return request(`/admin/customers/${id}`);
    },

    async updateCustomerStatus(id, isActive) {
      return request(`/admin/customers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive })
      });
    },

    // 7. Coupons
    async getCoupons() {
      return request('/admin/coupons');
    },

    async createCoupon(data) {
      return request('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async updateCoupon(id, data) {
      return request(`/admin/coupons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    async deleteCoupon(id) {
      return request(`/admin/coupons/${id}`, {
        method: 'DELETE'
      });
    },

    // 8. Reports
    async getSalesReport(days = 7) {
      return request(`/admin/reports/sales?days=${days}`);
    },

    async getTopProducts(limit = 10) {
      return request(`/admin/reports/top-products?limit=${limit}`);
    },

    async getOrdersByStatus() {
      return request('/admin/reports/orders-by-status');
    },

    // 9. Settings
    async getSettings() {
      return request('/admin/settings');
    },

    async updateSettings(data) {
      return request('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    // 10. Audit Logs
    async getAuditLogs(params = {}) {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/audit-logs?${query}`);
    }
  };
})();

window.AdminAPI = AdminAPI;
