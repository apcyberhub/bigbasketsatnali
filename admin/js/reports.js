/**
 * ==============================================================================
 * BIG BASKET ADMIN - REPORTS & SALES ANALYTICS CONTROLLER
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  ReportsController.init();
});

const ReportsController = (function () {
  let selectedDays = 7;

  function init() {
    setupPeriodSelector();
    loadReports();
  }

  function setupPeriodSelector() {
    const selector = document.getElementById('reportPeriodSelect');
    if (selector) {
      selector.addEventListener('change', () => {
        selectedDays = parseInt(selector.value) || 7;
        loadReports();
      });
    }
  }

  async function loadReports() {
    loadSalesSummary();
    loadTopProducts();
    loadOrdersByStatus();
  }

  async function loadSalesSummary() {
    try {
      const res = await AdminAPI.getSalesReport(selectedDays);
      if (!res || !res.success || !res.data) return;

      const data = res.data;
      document.getElementById('reportTotalRevenue').textContent = `₹${parseFloat(data.total_revenue || 0).toLocaleString('en-IN')}`;
      document.getElementById('reportTotalOrders').textContent = (data.total_orders || 0).toLocaleString();
      document.getElementById('reportAov').textContent = `₹${parseFloat(data.average_order_value || 0).toFixed(2)}`;

      const salesTbody = document.getElementById('salesTimelineTableBody');
      if (salesTbody) {
        if (!data.daily_sales || data.daily_sales.length === 0) {
          salesTbody.innerHTML = '<tr><td colspan="3" class="table-empty-state">No sales in selected period.</td></tr>';
        } else {
          salesTbody.innerHTML = data.daily_sales.map(day => `
            <tr>
              <td><strong>${day.date}</strong></td>
              <td>${day.orders_count} orders</td>
              <td><strong>₹${parseFloat(day.revenue).toLocaleString('en-IN')}</strong></td>
            </tr>
          `).join('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadTopProducts() {
    const tbody = document.getElementById('topProductsTableBody');
    if (!tbody) return;

    try {
      const res = await AdminAPI.getTopProducts(10);
      if (!res || !res.success || !res.data) return;

      const items = res.data;
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="table-empty-state">No product sales yet.</td></tr>';
        return;
      }

      tbody.innerHTML = items.map((p, idx) => `
        <tr>
          <td><strong>#${idx + 1}</strong></td>
          <td><strong>${p.name}</strong></td>
          <td>${p.units_sold} units</td>
          <td><strong>₹${parseFloat(p.revenue).toLocaleString('en-IN')}</strong></td>
        </tr>
      `).join('');

    } catch (err) {
      console.error(err);
    }
  }

  async function loadOrdersByStatus() {
    const tbody = document.getElementById('ordersByStatusTableBody');
    if (!tbody) return;

    try {
      const res = await AdminAPI.getOrdersByStatus();
      if (!res || !res.success || !res.data) return;

      const items = res.data;
      tbody.innerHTML = items.map(s => `
        <tr>
          <td><span class="badge badge-secondary">${s.status.replace(/_/g, ' ')}</span></td>
          <td><strong>${s.count}</strong></td>
        </tr>
      `).join('');

    } catch (err) {
      console.error(err);
    }
  }

  return {
    init,
    refresh: loadReports
  };
})();
