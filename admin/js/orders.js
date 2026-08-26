/**
 * ==============================================================================
 * BIG BASKET ADMIN - ORDERS MANAGEMENT CONTROLLER
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  OrdersController.init();
});

const OrdersController = (function () {
  let currentPage = 1;
  let currentStatus = 'all';
  let searchTimeout = null;

  function init() {
    setupFilters();
    loadOrders();
  }

  function setupFilters() {
    const searchInput = document.getElementById('searchOrderInput');
    const statusTabs = document.querySelectorAll('.status-tab');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          currentPage = 1;
          loadOrders();
        }, 300);
      });
    }

    statusTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        statusTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentStatus = tab.dataset.status || 'all';
        currentPage = 1;
        loadOrders();
      });
    });
  }

  async function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    const paginationWrapper = document.getElementById('ordersPagination');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="table-empty-state">
          <div class="empty-icon"><i class="fas fa-spinner fa-spin"></i></div>
          <div class="empty-title">Loading orders...</div>
        </td>
      </tr>
    `;

    const search = document.getElementById('searchOrderInput')?.value || '';

    const params = {
      page: currentPage,
      limit: 15,
      status_filter: currentStatus
    };
    if (search.trim()) params.search = search.trim();

    try {
      const res = await AdminAPI.getOrders(params);
      if (!res || !res.success || !res.data) {
        throw new Error(res.error?.message || 'Failed to load orders');
      }

      const { items, pagination } = res.data;

      if (items.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="table-empty-state">
              <div class="empty-icon"><i class="fas fa-shopping-bag"></i></div>
              <div class="empty-title">No orders found</div>
            </td>
          </tr>
        `;
        if (paginationWrapper) paginationWrapper.innerHTML = '';
        return;
      }

      tbody.innerHTML = items.map(o => {
        const statusClassMap = {
          pending: 'badge-warning',
          confirmed: 'badge-info',
          processing: 'badge-info',
          packed: 'badge-secondary',
          out_for_delivery: 'badge-warning',
          delivered: 'badge-success',
          cancelled: 'badge-danger'
        };
        const badgeClass = statusClassMap[o.status] || 'badge-secondary';
        const dateStr = new Date(o.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
          <tr>
            <td><strong>#${o.order_number}</strong></td>
            <td>
              <div class="product-meta">
                <span style="font-weight: 600;">${o.address?.full_name || 'Customer'}</span>
                <span class="product-submeta">${o.address?.phone || ''}</span>
              </div>
            </td>
            <td>${dateStr} <span class="product-submeta">${timeStr}</span></td>
            <td>${o.items ? o.items.length : 0} items</td>
            <td><strong>₹${parseFloat(o.total_amount).toLocaleString('en-IN')}</strong></td>
            <td><span class="badge badge-success">${o.payment_status}</span></td>
            <td><span class="badge ${badgeClass}">${o.status.replace(/_/g, ' ')}</span></td>
            <td>
              <div class="table-actions">
                <a href="order-details.html?id=${o.id}" class="btn btn-sm btn-primary">
                  <i class="fas fa-eye"></i> Manage
                </a>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      renderPagination(pagination);

    } catch (err) {
      console.error(err);
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="table-empty-state">
            <div class="empty-icon" style="color: #ef4444;"><i class="fas fa-exclamation-circle"></i></div>
            <div class="empty-title">Error loading orders</div>
            <div class="empty-desc">${err.message}</div>
          </td>
        </tr>
      `;
    }
  }

  function renderPagination(pagination) {
    const wrapper = document.getElementById('ordersPagination');
    if (!wrapper) return;

    const { total_count, page, total_pages, has_next, has_prev, limit } = pagination;
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total_count);

    wrapper.innerHTML = `
      <div class="pagination-info">
        Showing <strong>${start}</strong> to <strong>${end}</strong> of <strong>${total_count}</strong> orders
      </div>
      <div class="pagination-controls">
        <button class="page-btn" ${!has_prev ? 'disabled' : ''} onclick="OrdersController.goToPage(${page - 1})">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-btn active">${page}</span>
        <button class="page-btn" ${!has_next ? 'disabled' : ''} onclick="OrdersController.goToPage(${page + 1})">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;
  }

  function goToPage(p) {
    currentPage = p;
    loadOrders();
  }

  return {
    init,
    goToPage,
    refresh: loadOrders
  };
})();
