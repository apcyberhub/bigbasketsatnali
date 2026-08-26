/**
 * ==============================================================================
 * BIG BASKET ADMIN - COUPONS MANAGEMENT CONTROLLER
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  CouponsController.init();
});

const CouponsController = (function () {
  let editingCouponId = null;

  function init() {
    loadCoupons();
    setupAddModalTrigger();
    setupCouponForm();
  }

  async function loadCoupons() {
    const tbody = document.getElementById('couponsTableBody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty-state">
          <div class="empty-icon"><i class="fas fa-spinner fa-spin"></i></div>
          <div class="empty-title">Loading coupon codes...</div>
        </td>
      </tr>
    `;

    try {
      const res = await AdminAPI.getCoupons();
      if (!res || !res.success || !res.data) {
        throw new Error(res.error?.message || 'Failed to load coupons');
      }

      const coupons = res.data;

      if (coupons.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="table-empty-state">
              <div class="empty-icon"><i class="fas fa-ticket-alt"></i></div>
              <div class="empty-title">No coupons created yet</div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = coupons.map(c => {
        const discountStr = c.discount_type === 'percentage'
          ? `${parseFloat(c.discount_value)}% OFF`
          : `₹${parseFloat(c.discount_value).toFixed(2)} OFF`;

        const statusBadge = c.is_active
          ? '<span class="badge badge-success">Active</span>'
          : '<span class="badge badge-danger">Inactive</span>';

        return `
          <tr>
            <td><strong style="letter-spacing: 0.5px;">${c.code}</strong></td>
            <td><span class="badge badge-info">${discountStr}</span></td>
            <td>₹${parseFloat(c.minimum_order).toFixed(2)}</td>
            <td>${c.maximum_discount ? `₹${parseFloat(c.maximum_discount).toFixed(2)}` : 'No Cap'}</td>
            <td><strong>${c.used_count}</strong> / ${c.usage_limit}</td>
            <td>${statusBadge}</td>
            <td>
              <div class="table-actions">
                <button class="btn-action" title="Edit Coupon" onclick="CouponsController.openEditModal(${c.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-action btn-action-delete" title="Delete Coupon" onclick="CouponsController.deleteCoupon(${c.id}, '${c.code}')"><i class="fas fa-trash"></i></button>
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
            <div class="empty-title">Error loading coupons</div>
          </td>
        </tr>
      `;
    }
  }

  function setupAddModalTrigger() {
    const btn = document.getElementById('btnAddCoupon');
    if (btn) {
      btn.addEventListener('click', () => openAddModal());
    }
  }

  function openAddModal() {
    editingCouponId = null;
    document.getElementById('couponModalTitle').textContent = 'Create New Coupon';
    document.getElementById('couponForm').reset();
    document.getElementById('couponCode').disabled = false;
    document.getElementById('couponIsActive').checked = true;
    document.getElementById('couponModalBackdrop').classList.add('show');
  }

  async function openEditModal(id) {
    editingCouponId = id;
    document.getElementById('couponModalTitle').textContent = 'Edit Coupon';
    document.getElementById('couponModalBackdrop').classList.add('show');

    try {
      const res = await AdminAPI.getCoupons();
      const c = res.data.find(item => item.id === id);
      if (!c) throw new Error('Coupon not found');

      document.getElementById('couponCode').value = c.code;
      document.getElementById('couponCode').disabled = true;
      document.getElementById('couponDescription').value = c.description || '';
      document.getElementById('couponType').value = c.discount_type;
      document.getElementById('couponValue').value = c.discount_value;
      document.getElementById('couponMinOrder').value = c.minimum_order;
      document.getElementById('couponMaxDiscount').value = c.maximum_discount || '';
      document.getElementById('couponUsageLimit').value = c.usage_limit;
      document.getElementById('couponIsActive').checked = c.is_active;

    } catch (err) {
      adminToast(err.message, 'danger');
      closeModal();
    }
  }

  function closeModal() {
    const backdrop = document.getElementById('couponModalBackdrop');
    if (backdrop) backdrop.classList.remove('show');
  }

  function setupCouponForm() {
    const form = document.getElementById('couponForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const code = document.getElementById('couponCode').value.trim().toUpperCase();
      const description = document.getElementById('couponDescription').value.trim();
      const discountType = document.getElementById('couponType').value;
      const discountValue = parseFloat(document.getElementById('couponValue').value);
      const minOrder = parseFloat(document.getElementById('couponMinOrder').value) || 0;
      const maxDiscountRaw = document.getElementById('couponMaxDiscount').value;
      const maxDiscount = maxDiscountRaw ? parseFloat(maxDiscountRaw) : null;
      const usageLimit = parseInt(document.getElementById('couponUsageLimit').value) || 1000;
      const isActive = document.getElementById('couponIsActive').checked;

      if (!code || isNaN(discountValue) || discountValue <= 0) {
        adminToast('Please provide a valid coupon code and discount value.', 'warning');
        return;
      }

      const payload = {
        code,
        description: description || null,
        discount_type: discountType,
        discount_value: discountValue.toFixed(2),
        minimum_order: minOrder.toFixed(2),
        maximum_discount: maxDiscount ? maxDiscount.toFixed(2) : null,
        usage_limit: usageLimit,
        is_active: isActive
      };

      try {
        let res;
        if (editingCouponId) {
          res = await AdminAPI.updateCoupon(editingCouponId, payload);
        } else {
          res = await AdminAPI.createCoupon(payload);
        }

        if (res && res.success) {
          adminToast(`Coupon ${editingCouponId ? 'updated' : 'created'} successfully!`, 'success');
          closeModal();
          loadCoupons();
        } else {
          adminToast(res.error?.message || 'Failed to save coupon.', 'danger');
        }
      } catch (err) {
        adminToast(err.message, 'danger');
      }
    });
  }

  function deleteCoupon(id, code) {
    AdminModal.confirm({
      title: 'Delete Coupon',
      message: `Are you sure you want to permanently delete coupon "<strong>${code}</strong>"?`,
      confirmText: 'Delete Coupon',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          const res = await AdminAPI.deleteCoupon(id);
          if (res && res.success) {
            adminToast(`Coupon "${code}" deleted.`, 'success');
            loadCoupons();
          } else {
            adminToast(res.error?.message || 'Failed to delete coupon.', 'danger');
          }
        } catch (err) {
          adminToast(err.message, 'danger');
        }
      }
    });
  }

  return {
    init,
    openAddModal,
    openEditModal,
    closeModal,
    deleteCoupon
  };
})();
