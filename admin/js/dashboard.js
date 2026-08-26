/**
 * ==============================================================================
 * BIG BASKET ADMIN - DASHBOARD CONTROLLER
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  DashboardController.init();
});

const DashboardController = (function () {
  async function init() {
    loadDashboardStats();
  }

  async function loadDashboardStats() {
    const statsContainer = document.getElementById('dashboardStatsGrid');
    const recentOrdersContainer = document.getElementById('recentOrdersTableBody');
    const lowStockContainer = document.getElementById('lowStockTableBody');

    try {
      const res = await AdminAPI.getDashboardStats();
      if (!res || !res.success || !res.data) {
        throw new Error(res.error?.message || 'Failed to load stats');
      }

      const data = res.data;

      // 1. Populate Metrics
      document.getElementById('statRevenueToday').textContent = `₹${parseFloat(data.revenue_today || 0).toLocaleString('en-IN')}`;
      document.getElementById('statOrdersToday').textContent = (data.orders_today || 0).toLocaleString();
      document.getElementById('statTotalCustomers').textContent = (data.total_customers || 0).toLocaleString();
      document.getElementById('statTotalProducts').textContent = (data.total_products || 0).toLocaleString();
      document.getElementById('statLowStockProducts').textContent = (data.low_stock_products || 0).toLocaleString();
      document.getElementById('statPendingOrders').textContent = (data.pending_orders || 0).toLocaleString();

      // 2. Populate Recent Orders
      if (recentOrdersContainer) {
        if (!data.recent_orders || data.recent_orders.length === 0) {
          recentOrdersContainer.innerHTML = `
            <tr>
              <td colspan="5" class="table-empty-state">
                <div class="empty-icon"><i class="fas fa-shopping-bag"></i></div>
                <div class="empty-title">No orders placed today yet</div>
              </td>
            </tr>
          `;
        } else {
          recentOrdersContainer.innerHTML = data.recent_orders.map(order => {
            const statusClassMap = {
              pending: 'badge-warning',
              confirmed: 'badge-info',
              processing: 'badge-info',
              packed: 'badge-secondary',
              out_for_delivery: 'badge-warning',
              delivered: 'badge-success',
              cancelled: 'badge-danger'
            };
            const badgeClass = statusClassMap[order.status] || 'badge-secondary';
            const dateStr = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return `
              <tr>
                <td><strong>#${order.order_number}</strong></td>
                <td>${order.address?.full_name || 'Customer'}</td>
                <td>₹${parseFloat(order.total_amount).toLocaleString('en-IN')}</td>
                <td><span class="badge ${badgeClass}">${order.status.replace(/_/g, ' ')}</span></td>
                <td>
                  <a href="order-details.html?id=${order.id}" class="btn-action" title="View Order">
                    <i class="fas fa-eye"></i>
                  </a>
                </td>
              </tr>
            `;
          }).join('');
        }
      }

      // 3. Populate Low Stock Alerts
      if (lowStockContainer) {
        if (!data.low_stock_items || data.low_stock_items.length === 0) {
          lowStockContainer.innerHTML = `
            <tr>
              <td colspan="4" class="table-empty-state" style="padding: 30px;">
                <div style="color: #22c55e; font-size: 2rem; margin-bottom: 8px;"><i class="fas fa-check-circle"></i></div>
                <div style="font-weight: 600;">All inventory stocks healthy!</div>
              </td>
            </tr>
          `;
        } else {
          lowStockContainer.innerHTML = data.low_stock_items.map(prod => `
            <tr>
              <td>
                <div class="cell-product">
                  <div class="table-img">${prod.emoji || '🛒'}</div>
                  <div class="product-meta">
                    <span class="product-name-link">${prod.name}</span>
                    <span class="product-submeta">SKU: ${prod.sku}</span>
                  </div>
                </div>
              </td>
              <td><strong style="color: #d8232a;">${prod.stock_quantity} left</strong></td>
              <td>Threshold: ${prod.low_stock_threshold || 10}</td>
              <td>
                <a href="inventory.html?search=${encodeURIComponent(prod.sku)}" class="btn btn-sm btn-secondary">
                  Update
                </a>
              </td>
            </tr>
          `).join('');
        }
      }

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      adminToast('Failed to load real-time dashboard stats', 'danger');
    }
  }

  return {
    init,
    refresh: loadDashboardStats
  };
})();
