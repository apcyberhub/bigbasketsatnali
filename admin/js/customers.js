/**
 * ==============================================================================
 * BIG BASKET ADMIN - CUSTOMERS MANAGEMENT CONTROLLER
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  CustomersController.init();
});

const CustomersController = (function () {
  let currentPage = 1;
  let currentStatus = 'all';
  let searchTimeout = null;

  function init() {
    setupFilters();
    loadCustomers();
  }

  function setupFilters() {
    const searchInput = document.getElementById('searchCustomerInput');
    const statusTabs = document.querySelectorAll('.status-tab');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          currentPage = 1;
          loadCustomers();
        }, 300);
      });
    }

    statusTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        statusTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentStatus = tab.dataset.status || 'all';
        currentPage = 1;
        loadCustomers();
      });
    });
  }

  async function loadCustomers() {
    const tbody = document.getElementById('customersTableBody');
    const paginationWrapper = document.getElementById('customersPagination');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty-state">
          <div class="empty-icon"><i class="fas fa-spinner fa-spin"></i></div>
          <div class="empty-title">Loading customers...</div>
        </td>
      </tr>
    `;

    const search = document.getElementById('searchCustomerInput')?.value || '';

    const params = {
      page: currentPage,
      limit: 15,
      status_filter: currentStatus
    };
    if (search.trim()) params.search = search.trim();

    try {
      const res = await AdminAPI.getCustomers(params);
      if (!res || !res.success || !res.data) {
        throw new Error(res.error?.message || 'Failed to load customers');
      }

      const { items, pagination } = res.data;

      if (items.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="table-empty-state">
              <div class="empty-icon"><i class="fas fa-users"></i></div>
              <div class="empty-title">No customers found</div>
            </td>
          </tr>
        `;
        if (paginationWrapper) paginationWrapper.innerHTML = '';
        return;
      }

      tbody.innerHTML = items.map(c => {
        const initials = c.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const dateStr = new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        const statusBadge = c.is_active
          ? '<span class="badge badge-success">Active</span>'
          : '<span class="badge badge-danger">Disabled</span>';

        const toggleBtnText = c.is_active ? 'Disable' : 'Enable';
        const toggleBtnClass = c.is_active ? 'btn-danger' : 'btn-primary';

        return `
          <tr>
            <td>
              <div class="cell-product">
                <div class="user-avatar" style="width: 36px; height: 36px; font-size: 0.85rem;">${initials}</div>
                <div class="product-meta">
                  <span style="font-weight: 600;">${c.full_name}</span>
                  <span class="product-submeta">${c.email}</span>
                </div>
              </div>
            </td>
            <td><code>${c.phone}</code></td>
            <td><strong>${c.orders_count}</strong> orders</td>
            <td><strong>₹${parseFloat(c.total_spent).toLocaleString('en-IN')}</strong></td>
            <td>${statusBadge}</td>
            <td>${dateStr}</td>
            <td>
              <div class="table-actions">
                <button class="btn btn-sm ${toggleBtnClass}" onclick="CustomersController.toggleStatus(${c.id}, '${c.full_name.replace(/'/g, "\\'")}', ${!c.is_active})">
                  ${toggleBtnText}
                </button>
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
          <td colspan="7" class="table-empty-state">
            <div class="empty-icon" style="color: #ef4444;"><i class="fas fa-exclamation-circle"></i></div>
            <div class="empty-title">Error loading customers</div>
            <div class="empty-desc">${err.message}</div>
          </td>
        </tr>
      `;
    }
  }

  function renderPagination(pagination) {
    const wrapper = document.getElementById('customersPagination');
    if (!wrapper) return;

    const { total_count, page, total_pages, has_next, has_prev, limit } = pagination;
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total_count);

    wrapper.innerHTML = `
      <div class="pagination-info">
        Showing <strong>${start}</strong> to <strong>${end}</strong> of <strong>${total_count}</strong> customers
      </div>
      <div class="pagination-controls">
        <button class="page-btn" ${!has_prev ? 'disabled' : ''} onclick="CustomersController.goToPage(${page - 1})">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-btn active">${page}</span>
        <button class="page-btn" ${!has_next ? 'disabled' : ''} onclick="CustomersController.goToPage(${page + 1})">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;
  }

  function goToPage(p) {
    currentPage = p;
    loadCustomers();
  }

  function toggleStatus(id, name, newActiveState) {
    const actionWord = newActiveState ? 'Enable' : 'Disable';
    AdminModal.confirm({
      title: `${actionWord} Customer Account`,
      message: `Are you sure you want to ${actionWord.toLowerCase()} the account for "<strong>${name}</strong>"?`,
      confirmText: actionWord,
      confirmClass: newActiveState ? 'btn-primary' : 'btn-danger',
      onConfirm: async () => {
        try {
          const res = await AdminAPI.updateCustomerStatus(id, newActiveState);
          if (res && res.success) {
            adminToast(`Customer account ${actionWord.toLowerCase()}d successfully.`, 'success');
            loadCustomers();
          } else {
            adminToast(res.error?.message || 'Failed to update customer status.', 'danger');
          }
        } catch (err) {
          adminToast(err.message, 'danger');
        }
      }
    });
  }

  return {
    init,
    goToPage,
    toggleStatus
  };
})();
