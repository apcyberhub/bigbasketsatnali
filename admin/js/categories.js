/**
 * ==============================================================================
 * BIG BASKET ADMIN - CATEGORIES MANAGEMENT CONTROLLER
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  CategoriesController.init();
});

const CategoriesController = (function () {
  let editingCategoryId = null;

  function init() {
    loadCategories();
    setupAddModalTrigger();
    setupCategoryForm();
  }

  async function loadCategories() {
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty-state">
          <div class="empty-icon"><i class="fas fa-spinner fa-spin"></i></div>
          <div class="empty-title">Loading categories...</div>
        </td>
      </tr>
    `;

    try {
      const res = await AdminAPI.getCategories();
      if (!res || !res.success || !res.data) {
        throw new Error(res.error?.message || 'Failed to load categories');
      }

      const categories = res.data;

      if (categories.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="table-empty-state">
              <div class="empty-icon"><i class="fas fa-tags"></i></div>
              <div class="empty-title">No categories created yet</div>
            </td>
          </tr>
        `;
        return;
      }

      // Build parent map
      const catMap = {};
      categories.forEach(c => catMap[c.id] = c.name);

      tbody.innerHTML = categories.map(c => {
        const parentName = c.parent_id ? (catMap[c.parent_id] || 'Parent') : '— (Main Category)';
        const statusBadge = c.is_active
          ? '<span class="badge badge-success">Active</span>'
          : '<span class="badge badge-danger">Inactive</span>';

        const actionBtns = c.is_active
          ? `
            <button class="btn-action" title="Edit" onclick="CategoriesController.openEditModal(${c.id})"><i class="fas fa-edit"></i></button>
            <button class="btn-action btn-action-delete" title="Deactivate" onclick="CategoriesController.deleteCategory(${c.id}, '${c.name.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
          `
          : `
            <button class="btn-action" title="Edit" onclick="CategoriesController.openEditModal(${c.id})"><i class="fas fa-edit"></i></button>
            <button class="btn-action btn-action-restore" title="Restore" onclick="CategoriesController.restoreCategory(${c.id}, '${c.name.replace(/'/g, "\\'")}')"><i class="fas fa-trash-restore"></i></button>
          `;

        return `
          <tr>
            <td style="font-size: 1.5rem; text-align: center;">${c.icon || '🏷️'}</td>
            <td><strong>${c.name}</strong></td>
            <td><code>${c.slug}</code></td>
            <td>${parentName}</td>
            <td>${c.discount_label || '—'}</td>
            <td>${statusBadge}</td>
            <td>
              <div class="table-actions">
                ${actionBtns}
              </div>
            </td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      console.error(err);
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty-state">
            <div class="empty-icon" style="color: #ef4444;"><i class="fas fa-exclamation-circle"></i></div>
            <div class="empty-title">Error loading categories</div>
          </td>
        </tr>
      `;
    }
  }

  function setupAddModalTrigger() {
    const btn = document.getElementById('btnAddCategory');
    if (btn) {
      btn.addEventListener('click', () => openAddModal());
    }
  }

  async function populateParentDropdown(selectedId = null, excludeId = null) {
    const select = document.getElementById('catParentId');
    if (!select) return;

    select.innerHTML = '<option value="">None (Top-Level Category)</option>';
    try {
      const res = await AdminAPI.getCategories();
      if (res && res.success && Array.isArray(res.data)) {
        res.data.forEach(c => {
          if (excludeId && c.id === excludeId) return;
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = `${c.icon || ''} ${c.name}`;
          if (selectedId && c.id === selectedId) opt.selected = true;
          select.appendChild(opt);
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  function openAddModal() {
    editingCategoryId = null;
    document.getElementById('categoryModalTitle').textContent = 'Add New Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('catIsActive').checked = true;
    populateParentDropdown();
    document.getElementById('categoryModalBackdrop').classList.add('show');
  }

  async function openEditModal(id) {
    editingCategoryId = id;
    document.getElementById('categoryModalTitle').textContent = 'Edit Category';
    document.getElementById('categoryModalBackdrop').classList.add('show');

    try {
      const res = await AdminAPI.getCategory(id);
      if (!res || !res.success || !res.data) throw new Error('Category not found');

      const c = res.data;
      document.getElementById('catName').value = c.name;
      document.getElementById('catSlug').value = c.slug;
      document.getElementById('catIcon').value = c.icon || '';
      document.getElementById('catDiscount').value = c.discount_label || '';
      document.getElementById('catSortOrder').value = c.sort_order || 0;
      document.getElementById('catDescription').value = c.description || '';
      document.getElementById('catIsActive').checked = c.is_active;

      populateParentDropdown(c.parent_id, id);
    } catch (err) {
      adminToast(err.message, 'danger');
      closeModal();
    }
  }

  function closeModal() {
    const backdrop = document.getElementById('categoryModalBackdrop');
    if (backdrop) backdrop.classList.remove('show');
  }

  function setupCategoryForm() {
    const form = document.getElementById('categoryForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('catName').value.trim();
      const slug = document.getElementById('catSlug').value.trim();
      const icon = document.getElementById('catIcon').value.trim();
      const discount = document.getElementById('catDiscount').value.trim();
      const sortOrder = parseInt(document.getElementById('catSortOrder').value) || 0;
      const parentIdRaw = document.getElementById('catParentId').value;
      const parentId = parentIdRaw ? parseInt(parentIdRaw) : null;
      const description = document.getElementById('catDescription').value.trim();
      const isActive = document.getElementById('catIsActive').checked;

      if (!name) {
        adminToast('Category name is required.', 'warning');
        return;
      }

      const payload = {
        name,
        slug: slug || null,
        icon: icon || null,
        discount_label: discount || null,
        sort_order: sortOrder,
        parent_id: parentId,
        description: description || null,
        is_active: isActive
      };

      try {
        let res;
        if (editingCategoryId) {
          res = await AdminAPI.updateCategory(editingCategoryId, payload);
        } else {
          res = await AdminAPI.createCategory(payload);
        }

        if (res && res.success) {
          adminToast(`Category ${editingCategoryId ? 'updated' : 'created'} successfully!`, 'success');
          closeModal();
          loadCategories();
        } else {
          adminToast(res.error?.message || 'Failed to save category.', 'danger');
        }
      } catch (err) {
        adminToast(err.message, 'danger');
      }
    });
  }

  function deleteCategory(id, name) {
    AdminModal.confirm({
      title: 'Deactivate Category',
      message: `Are you sure you want to deactivate "<strong>${name}</strong>"?`,
      confirmText: 'Deactivate',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        const res = await AdminAPI.deleteCategory(id);
        if (res && res.success) {
          adminToast(res.data?.message || `Category "${name}" deactivated.`, 'success');
          loadCategories();
        } else {
          adminToast(res.error?.message || 'Failed to delete category.', 'danger');
        }
      }
    });
  }

  function restoreCategory(id, name) {
    AdminModal.confirm({
      title: 'Restore Category',
      message: `Restore "<strong>${name}</strong>" back to active status?`,
      confirmText: 'Restore',
      confirmClass: 'btn-primary',
      onConfirm: async () => {
        const res = await AdminAPI.restoreCategory(id);
        if (res && res.success) {
          adminToast(`Category "${name}" restored successfully.`, 'success');
          loadCategories();
        } else {
          adminToast(res.error?.message || 'Failed to restore category.', 'danger');
        }
      }
    });
  }

  return {
    init,
    openAddModal,
    openEditModal,
    closeModal,
    deleteCategory,
    restoreCategory
  };
})();
