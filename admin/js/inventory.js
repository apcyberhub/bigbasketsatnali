/**
 * ==============================================================================
 * BIG BASKET ADMIN - INVENTORY MANAGEMENT CONTROLLER
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  InventoryController.init();
});

const InventoryController = (function () {
  let currentPage = 1;
  let currentStatus = 'all';
  let selectedProductId = null;
  let searchTimeout = null;

  function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      document.getElementById('searchInventoryInput').value = searchParam;
    }

    setupFilters();
    setupStockModal();
    loadInventory();
  }

  function setupFilters() {
    const searchInput = document.getElementById('searchInventoryInput');
    const statusTabs = document.querySelectorAll('.status-tab');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          currentPage = 1;
          loadInventory();
        }, 300);
      });
    }

    statusTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        statusTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentStatus = tab.dataset.status || 'all';
        currentPage = 1;
        loadInventory();
      });
    });
  }

  async function loadInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    const paginationWrapper = document.getElementById('inventoryPagination');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty-state">
          <div class="empty-icon"><i class="fas fa-spinner fa-spin"></i></div>
          <div class="empty-title">Loading stock inventory...</div>
        </td>
      </tr>
    `;

    const search = document.getElementById('searchInventoryInput')?.value || '';

    const params = {
      page: currentPage,
      limit: 15,
      status_filter: currentStatus
    };
    if (search.trim()) params.search = search.trim();

    try {
      const res = await AdminAPI.getInventory(params);
      if (!res || !res.success || !res.data) {
        throw new Error(res.error?.message || 'Failed to load inventory');
      }

      const { items, pagination } = res.data;

      if (items.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="table-empty-state">
              <div class="empty-icon"><i class="fas fa-boxes"></i></div>
              <div class="empty-title">No inventory records found</div>
            </td>
          </tr>
        `;
        if (paginationWrapper) paginationWrapper.innerHTML = '';
        return;
      }

      tbody.innerHTML = items.map(p => {
        let statusBadge = '<span class="badge badge-success">In Stock</span>';
        if (p.stock_quantity === 0) {
          statusBadge = '<span class="badge badge-danger">Out of Stock</span>';
        } else if (p.stock_quantity <= p.low_stock_threshold) {
          statusBadge = '<span class="badge badge-warning">Low Stock</span>';
        }

        return `
          <tr>
            <td>
              <div class="cell-product">
                <div class="table-img">${p.emoji || '🛒'}</div>
                <div class="product-meta">
                  <span class="product-name-link">${p.name}</span>
                  <span class="product-submeta">${p.brand} • ${p.weight || ''}</span>
                </div>
              </div>
            </td>
            <td><code>${p.sku}</code></td>
            <td>
              <strong style="font-size: 1.05rem; ${p.stock_quantity <= p.low_stock_threshold ? 'color: #d8232a;' : ''}">
                ${p.stock_quantity}
              </strong> ${p.unit || 'pcs'}
            </td>
            <td>${p.low_stock_threshold || 10}</td>
            <td>${statusBadge}</td>
            <td>
              <div class="table-actions">
                <button class="btn btn-sm btn-primary" onclick="InventoryController.openStockModal(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.stock_quantity})">
                  <i class="fas fa-plus-minus"></i> Update Stock
                </button>
                <button class="btn-action" title="View History" onclick="InventoryController.viewStockHistory(${p.id}, '${p.name.replace(/'/g, "\\'")}')">
                  <i class="fas fa-history"></i>
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
            <div class="empty-title">Error loading inventory</div>
          </td>
        </tr>
      `;
    }
  }

  function renderPagination(pagination) {
    const wrapper = document.getElementById('inventoryPagination');
    if (!wrapper) return;

    const { total_count, page, total_pages, has_next, has_prev, limit } = pagination;
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total_count);

    wrapper.innerHTML = `
      <div class="pagination-info">
        Showing <strong>${start}</strong> to <strong>${end}</strong> of <strong>${total_count}</strong> products
      </div>
      <div class="pagination-controls">
        <button class="page-btn" ${!has_prev ? 'disabled' : ''} onclick="InventoryController.goToPage(${page - 1})">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-btn active">${page}</span>
        <button class="page-btn" ${!has_next ? 'disabled' : ''} onclick="InventoryController.goToPage(${page + 1})">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;
  }

  function goToPage(p) {
    currentPage = p;
    loadInventory();
  }

  function openStockModal(productId, productName, currentStock) {
    selectedProductId = productId;
    document.getElementById('stockModalProdName').textContent = productName;
    document.getElementById('stockModalCurrent').textContent = currentStock;
    document.getElementById('stockNewQty').value = currentStock;
    document.getElementById('stockReason').value = 'stock_added';
    document.getElementById('stockNotes').value = '';
    document.getElementById('stockModalBackdrop').classList.add('show');
  }

  function closeStockModal() {
    document.getElementById('stockModalBackdrop').classList.remove('show');
  }

  function setupStockModal() {
    const form = document.getElementById('stockUpdateForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!selectedProductId) return;

      const newQty = parseInt(document.getElementById('stockNewQty').value);
      const reason = document.getElementById('stockReason').value;
      const notes = document.getElementById('stockNotes').value.trim();

      if (isNaN(newQty) || newQty < 0) {
        adminToast('Stock quantity cannot be negative.', 'warning');
        return;
      }

      try {
        const res = await AdminAPI.updateStock(selectedProductId, {
          new_quantity: newQty,
          reason,
          notes: notes || null
        });

        if (res && res.success) {
          adminToast('Inventory stock updated successfully!', 'success');
          closeStockModal();
          loadInventory();
        } else {
          adminToast(res.error?.message || 'Failed to update stock', 'danger');
        }
      } catch (err) {
        adminToast(err.message, 'danger');
      }
    });
  }

  async function viewStockHistory(productId, productName) {
    const modalBackdrop = document.getElementById('historyModalBackdrop');
    const tbody = document.getElementById('historyTableBody');
    document.getElementById('historyModalProdName').textContent = productName;
    modalBackdrop.classList.add('show');

    tbody.innerHTML = '<tr><td colspan="5" class="table-empty-state"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

    try {
      const res = await AdminAPI.getInventoryTransactions({ product_id: productId });
      if (!res || !res.success || !res.data || res.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="table-empty-state">No adjustment records found.</td></tr>';
        return;
      }

      tbody.innerHTML = res.data.map(tx => {
        const changeStr = tx.change_quantity > 0 ? `+${tx.change_quantity}` : `${tx.change_quantity}`;
        const changeColor = tx.change_quantity > 0 ? '#22c55e' : '#ef4444';
        const dateStr = new Date(tx.created_at).toLocaleString();

        return `
          <tr>
            <td>${dateStr}</td>
            <td><span class="badge badge-secondary">${tx.reason.replace(/_/g, ' ')}</span></td>
            <td>${tx.previous_quantity}</td>
            <td><strong style="color: ${changeColor};">${changeStr}</strong></td>
            <td><strong>${tx.new_quantity}</strong></td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="table-empty-state" style="color: #ef4444;">${err.message}</td></tr>`;
    }
  }

  function closeHistoryModal() {
    document.getElementById('historyModalBackdrop').classList.remove('show');
  }

  return {
    init,
    goToPage,
    openStockModal,
    closeStockModal,
    viewStockHistory,
    closeHistoryModal
  };
})();
