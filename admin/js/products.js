/**
 * ==============================================================================
 * BIG BASKET ADMIN - PRODUCTS LIST CONTROLLER
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  ProductsController.init();
});

const ProductsController = (function () {
  let currentPage = 1;
  let currentStatus = 'all';
  let searchTimeout = null;

  function init() {
    loadCategoriesFilter();
    setupFilters();
    loadProducts();
  }

  async function loadCategoriesFilter() {
    const select = document.getElementById('filterCategory');
    if (!select) return;

    try {
      const res = await AdminAPI.getCategories();
      if (res && res.success && Array.isArray(res.data)) {
        res.data.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat.id;
          opt.textContent = cat.name;
          select.appendChild(opt);
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  function setupFilters() {
    const searchInput = document.getElementById('searchProductInput');
    const categorySelect = document.getElementById('filterCategory');
    const sortSelect = document.getElementById('sortProducts');
    const statusTabs = document.querySelectorAll('.status-tab');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          currentPage = 1;
          loadProducts();
        }, 300);
      });
    }

    if (categorySelect) {
      categorySelect.addEventListener('change', () => {
        currentPage = 1;
        loadProducts();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        currentPage = 1;
        loadProducts();
      });
    }

    statusTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        statusTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentStatus = tab.dataset.status || 'all';
        currentPage = 1;
        loadProducts();
      });
    });
  }

  async function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    const paginationWrapper = document.getElementById('productsPagination');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="table-empty-state">
          <div class="empty-icon"><i class="fas fa-spinner fa-spin"></i></div>
          <div class="empty-title">Loading catalog...</div>
        </td>
      </tr>
    `;

    const search = document.getElementById('searchProductInput')?.value || '';
    const categoryId = document.getElementById('filterCategory')?.value || '';
    const sort = document.getElementById('sortProducts')?.value || 'newest';

    const params = {
      page: currentPage,
      limit: 15,
      status_filter: currentStatus,
      sort: sort
    };

    if (search.trim()) params.search = search.trim();
    if (categoryId) params.category_id = categoryId;

    try {
      const res = await AdminAPI.getProducts(params);
      if (!res || !res.success || !res.data) {
        throw new Error(res.error?.message || 'Failed to fetch products');
      }

      const { items, pagination } = res.data;

      if (items.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" class="table-empty-state">
              <div class="empty-icon"><i class="fas fa-box-open"></i></div>
              <div class="empty-title">No products found</div>
              <div class="empty-desc">Try clearing your search filters or add a new product.</div>
              <a href="product-form.html" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> Add Product</a>
            </td>
          </tr>
        `;
        if (paginationWrapper) paginationWrapper.innerHTML = '';
        return;
      }

      tbody.innerHTML = items.map(p => {
        const statusBadge = p.is_active
          ? (p.stock_quantity <= p.low_stock_threshold ? '<span class="badge badge-warning">Low Stock</span>' : '<span class="badge badge-success">Active</span>')
          : '<span class="badge badge-danger">Inactive</span>';

        const actionBtns = p.is_active
          ? `
            <a href="product-form.html?id=${p.id}" class="btn-action" title="Edit Product"><i class="fas fa-edit"></i></a>
            <button class="btn-action btn-action-delete" title="Deactivate Product" onclick="ProductsController.deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
          `
          : `
            <a href="product-form.html?id=${p.id}" class="btn-action" title="Edit Product"><i class="fas fa-edit"></i></a>
            <button class="btn-action btn-action-restore" title="Restore Product" onclick="ProductsController.restoreProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')"><i class="fas fa-trash-restore"></i></button>
          `;

        return `
          <tr>
            <td>
              <div class="table-img">${p.emoji || '🛒'}</div>
            </td>
            <td><code>${p.sku}</code></td>
            <td>
              <div class="product-meta">
                <a href="product-form.html?id=${p.id}" class="product-name-link">${p.name}</a>
                <span class="product-submeta">${p.weight || ''} • ${p.brand}</span>
              </div>
            </td>
            <td>${p.brand}</td>
            <td><strong>₹${parseFloat(p.price).toFixed(2)}</strong></td>
            <td style="text-decoration: line-through; color: var(--admin-text-muted);">₹${parseFloat(p.mrp).toFixed(2)}</td>
            <td>
              <strong style="${p.stock_quantity <= p.low_stock_threshold ? 'color: #d8232a;' : ''}">
                ${p.stock_quantity}
              </strong>
            </td>
            <td>${statusBadge}</td>
            <td>
              <div class="table-actions">
                ${actionBtns}
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
          <td colspan="9" class="table-empty-state">
            <div class="empty-icon" style="color: #ef4444;"><i class="fas fa-exclamation-circle"></i></div>
            <div class="empty-title">Error loading products</div>
            <div class="empty-desc">${err.message}</div>
          </td>
        </tr>
      `;
    }
  }

  function renderPagination(pagination) {
    const wrapper = document.getElementById('productsPagination');
    if (!wrapper) return;

    const { total_count, page, total_pages, has_next, has_prev, limit } = pagination;
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total_count);

    wrapper.innerHTML = `
      <div class="pagination-info">
        Showing <strong>${start}</strong> to <strong>${end}</strong> of <strong>${total_count}</strong> products
      </div>
      <div class="pagination-controls">
        <button class="page-btn" ${!has_prev ? 'disabled' : ''} onclick="ProductsController.goToPage(${page - 1})">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-btn active">${page}</span>
        <button class="page-btn" ${!has_next ? 'disabled' : ''} onclick="ProductsController.goToPage(${page + 1})">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;
  }

  function goToPage(page) {
    currentPage = page;
    loadProducts();
  }

  function deleteProduct(id, name) {
    AdminModal.confirm({
      title: 'Deactivate Product',
      message: `Are you sure you want to deactivate "<strong>${name}</strong>"? It will be hidden from customer store but can be restored anytime.`,
      confirmText: 'Deactivate',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        const res = await AdminAPI.softDeleteProduct(id);
        if (res && res.success) {
          adminToast(`Product "${name}" deactivated`, 'success');
          loadProducts();
        } else {
          adminToast(res.error?.message || 'Failed to deactivate product', 'danger');
        }
      }
    });
  }

  function restoreProduct(id, name) {
    AdminModal.confirm({
      title: 'Restore Product',
      message: `Restore "<strong>${name}</strong>" back to active store listing?`,
      confirmText: 'Restore Product',
      confirmClass: 'btn-primary',
      onConfirm: async () => {
        const res = await AdminAPI.restoreProduct(id);
        if (res && res.success) {
          adminToast(`Product "${name}" restored successfully`, 'success');
          loadProducts();
        } else {
          adminToast(res.error?.message || 'Failed to restore product', 'danger');
        }
      }
    });
  }

  return {
    init,
    goToPage,
    deleteProduct,
    restoreProduct,
    refresh: loadProducts
  };
})();
