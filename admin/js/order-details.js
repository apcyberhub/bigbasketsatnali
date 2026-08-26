/**
 * ==============================================================================
 * BIG BASKET ADMIN - ORDER DETAILS & STATUS WORKFLOW CONTROLLER
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  OrderDetailsController.init();
});

const OrderDetailsController = (function () {
  let orderId = null;

  function init() {
    const urlParams = new URLSearchParams(window.location.search);
    orderId = urlParams.get('id');

    if (!orderId) {
      adminToast('Order ID missing.', 'danger');
      return;
    }

    loadOrderDetails();
    setupStatusForm();
  }

  async function loadOrderDetails() {
    try {
      const res = await AdminAPI.getOrder(orderId);
      if (!res || !res.success || !res.data) {
        throw new Error(res.error?.message || 'Order not found.');
      }

      const o = res.data;

      // Header
      document.getElementById('orderNumberTitle').textContent = `Order #${o.order_number}`;
      document.getElementById('orderDate').textContent = `Placed on ${new Date(o.created_at).toLocaleString()}`;

      const statusBadge = document.getElementById('orderStatusBadge');
      statusBadge.textContent = o.status.replace(/_/g, ' ');
      const statusClassMap = {
        pending: 'badge-warning',
        confirmed: 'badge-info',
        processing: 'badge-info',
        packed: 'badge-secondary',
        out_for_delivery: 'badge-warning',
        delivered: 'badge-success',
        cancelled: 'badge-danger'
      };
      statusBadge.className = `badge ${statusClassMap[o.status] || 'badge-secondary'}`;

      // Customer Info
      document.getElementById('custName').textContent = o.address?.full_name || 'Customer';
      document.getElementById('custPhone').textContent = o.address?.phone || '—';
      document.getElementById('custAddress').textContent = o.address
        ? `${o.address.address_line1}, ${o.address.address_line2}, ${o.address.landmark || ''}, ${o.address.city}, ${o.address.state} - ${o.address.pincode}`
        : 'Store Pickup';

      // Payment Info
      document.getElementById('paymentMethod').textContent = o.payment_method;
      document.getElementById('paymentStatus').textContent = o.payment_status;

      let activePayment = null;
      if (o.payments && o.payments.length > 0) {
        activePayment = o.payments[0];
      }

      const pIdRow = document.getElementById('paymentIdRow');
      const refundRow = document.getElementById('refundInfoRow');
      const refundBtn = document.getElementById('btnAdminRefund');

      if (activePayment) {
        pIdRow.style.display = 'block';
        document.getElementById('paymentIdVal').textContent = activePayment.provider_payment_id || activePayment.provider_order_id || `PAY-${activePayment.id}`;

        const refundedAmount = (activePayment.refunds || []).reduce((acc, r) => acc + (r.status === 'processed' ? parseFloat(r.amount) : 0), 0);
        const refundableBalance = Math.max(0, parseFloat(activePayment.amount) - refundedAmount);

        if (refundedAmount > 0) {
          refundRow.style.display = 'block';
          document.getElementById('refundedVal').textContent = `₹${refundedAmount.toFixed(2)}`;
        } else {
          refundRow.style.display = 'none';
        }

        // Show refund button if payment is captured and refundable balance > 0
        if (activePayment.status === 'captured' && refundableBalance > 0) {
          refundBtn.style.display = 'block';
          refundBtn.onclick = () => openRefundModal(activePayment, refundableBalance);
        } else {
          refundBtn.style.display = 'none';
        }
      } else {
        pIdRow.style.display = 'none';
        refundRow.style.display = 'none';
        refundBtn.style.display = 'none';
      }

      // Items Table
      const itemsBody = document.getElementById('orderItemsTableBody');
      if (itemsBody) {
        itemsBody.innerHTML = o.items.map(item => `
          <tr>
            <td>
              <strong>${item.product_name}</strong>
              <div style="font-size: 0.75rem; color: var(--admin-text-muted);">${item.product_weight || ''}</div>
            </td>
            <td>₹${parseFloat(item.unit_price).toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td><strong>₹${parseFloat(item.total_price).toFixed(2)}</strong></td>
          </tr>
        `).join('');
      }

      // Summary
      document.getElementById('orderSubtotal').textContent = `₹${parseFloat(o.subtotal).toFixed(2)}`;
      document.getElementById('orderDiscount').textContent = `-₹${parseFloat(o.discount).toFixed(2)}`;
      document.getElementById('orderDeliveryFee').textContent = parseFloat(o.delivery_fee) === 0 ? 'FREE' : `₹${parseFloat(o.delivery_fee).toFixed(2)}`;
      document.getElementById('orderGrandTotal').textContent = `₹${parseFloat(o.total_amount).toFixed(2)}`;

      // Render Visual Timeline & Dynamic Status Options
      renderTimeline(o.status);
      renderStatusOptions(o.status);

    } catch (err) {
      console.error(err);
      adminToast(err.message, 'danger');
    }
  }

  function renderTimeline(currentStatus) {
    const container = document.getElementById('fulfillmentTimelineBody');
    if (!container) return;

    if (currentStatus === 'cancelled') {
      container.innerHTML = `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; color: #991b1b; display: flex; align-items: center; gap: 10px;">
          <i class="fas fa-times-circle" style="font-size: 1.25rem;"></i>
          <div>
            <strong>Order Cancelled</strong>
            <div style="font-size: 0.8rem; color: #b91c1c;">This order has been cancelled and closed.</div>
          </div>
        </div>
      `;
      return;
    }

    const steps = [
      { key: 'pending', label: 'Order Placed' },
      { key: 'confirmed', label: 'Confirmed' },
      { key: 'processing', label: 'Processing / Picking' },
      { key: 'packed', label: 'Packed & Sealed' },
      { key: 'out_for_delivery', label: 'Out for Delivery' },
      { key: 'delivered', label: 'Delivered' }
    ];

    const currentIdx = steps.findIndex(s => s.key === currentStatus);
    const activeIdx = currentIdx >= 0 ? currentIdx : 0;

    let timelineHTML = `<div style="display: flex; flex-direction: column; gap: 14px; position: relative; padding-left: 24px;">`;

    steps.forEach((step, idx) => {
      const isPast = idx < activeIdx;
      const isCurrent = idx === activeIdx;
      const isFuture = idx > activeIdx;

      let iconColor = isPast ? '#22c55e' : (isCurrent ? '#3b82f6' : '#cbd5e1');
      let icon = isPast ? '✓' : (isCurrent ? '●' : '○');
      let textWeight = isCurrent ? '700' : (isPast ? '600' : '400');
      let textColor = isCurrent ? '#1e293b' : (isPast ? '#334155' : '#94a3b8');

      timelineHTML += `
        <div style="display: flex; align-items: center; gap: 12px; position: relative;">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: ${isPast ? '#dcfce7' : (isCurrent ? '#dbeafe' : '#f1f5f9')}; color: ${iconColor}; font-weight: 700; font-size: 0.8rem; border: 1.5px solid ${iconColor};">
            ${icon}
          </span>
          <span style="font-size: 0.9rem; font-weight: ${textWeight}; color: ${textColor};">
            ${step.label}
            ${isCurrent ? ' <span style="font-size: 0.75rem; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">CURRENT</span>' : ''}
          </span>
        </div>
      `;
    });

    timelineHTML += `</div>`;
    container.innerHTML = timelineHTML;
  }

  function renderStatusOptions(currentStatus) {
    const select = document.getElementById('selectNewStatus');
    const submitBtn = document.getElementById('btnUpdateStatusSubmit');
    const notesInput = document.getElementById('statusNotes');

    if (!select || !submitBtn) return;

    const transitionMap = {
      pending: [
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'cancelled', label: 'Cancel Order' }
      ],
      confirmed: [
        { value: 'processing', label: 'Processing / Picking' },
        { value: 'packed', label: 'Packed & Ready' },
        { value: 'cancelled', label: 'Cancel Order' }
      ],
      processing: [
        { value: 'packed', label: 'Packed & Sealed' },
        { value: 'out_for_delivery', label: 'Out for Delivery' },
        { value: 'cancelled', label: 'Cancel Order' }
      ],
      packed: [
        { value: 'out_for_delivery', label: 'Out for Delivery' },
        { value: 'delivered', label: 'Mark as Delivered' },
        { value: 'cancelled', label: 'Cancel Order' }
      ],
      out_for_delivery: [
        { value: 'delivered', label: 'Mark as Delivered' },
        { value: 'cancelled', label: 'Cancel Order' }
      ],
      delivered: [],
      cancelled: []
    };

    const nextOptions = transitionMap[currentStatus] || [];

    if (nextOptions.length === 0) {
      select.innerHTML = `<option value="">Final State (${currentStatus.toUpperCase()})</option>`;
      select.disabled = true;
      if (notesInput) notesInput.disabled = true;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fas fa-lock"></i> Order Finalized`;
      submitBtn.style.opacity = '0.6';
    } else {
      select.disabled = false;
      if (notesInput) notesInput.disabled = false;
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fas fa-sync-alt"></i> Update Status`;
      submitBtn.style.opacity = '1';

      select.innerHTML = '<option value="">Select Next Status...</option>' + nextOptions.map(opt => `
        <option value="${opt.value}">${opt.label}</option>
      `).join('');
    }
  }

  function openRefundModal(payment, refundableBalance) {
    const modal = document.getElementById('adminRefundModal');
    if (!modal) return;

    document.getElementById('modalRefundableBalance').textContent = `₹${refundableBalance.toFixed(2)}`;
    const amtInput = document.getElementById('modalRefundAmount');
    amtInput.value = refundableBalance.toFixed(2);
    amtInput.max = refundableBalance.toFixed(2);
    document.getElementById('modalRefundReason').value = '';

    modal.style.display = 'flex';

    const form = document.getElementById('adminRefundForm');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const refundAmt = parseFloat(amtInput.value);
      const reason = document.getElementById('modalRefundReason').value.trim();

      if (refundAmt <= 0 || refundAmt > refundableBalance) {
        adminToast('Invalid refund amount.', 'warning');
        return;
      }

      try {
        const res = await LocalMartAPI.adminRefundPayment(payment.id, {
          amount: refundAmt,
          reason: reason
        });
        if (res && res.success) {
          adminToast('Refund processed successfully!', 'success');
          closeRefundModal();
          loadOrderDetails();
        } else {
          adminToast(res.message || 'Refund failed.', 'danger');
        }
      } catch (rErr) {
        adminToast(rErr.message || 'Refund error.', 'danger');
      }
    };
  }

  window.closeRefundModal = () => {
    const modal = document.getElementById('adminRefundModal');
    if (modal) modal.style.display = 'none';
  };

  function setupStatusForm() {
    const form = document.getElementById('orderStatusForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const newStatus = document.getElementById('selectNewStatus').value;
      const notes = document.getElementById('statusNotes').value.trim();

      if (!newStatus) {
        adminToast('Please select a valid next status.', 'warning');
        return;
      }

      AdminModal.confirm({
        title: 'Update Order Status',
        message: `Change order status to "<strong>${newStatus.replace(/_/g, ' ')}</strong>"?`,
        confirmText: 'Update Status',
        confirmClass: 'btn-primary',
        onConfirm: async () => {
          try {
            const res = await AdminAPI.updateOrderStatus(orderId, newStatus, notes);
            if (res && res.success) {
              adminToast('Order status updated successfully!', 'success');
              loadOrderDetails();
            } else {
              adminToast(res.error?.message || 'Failed to update order status.', 'danger');
            }
          } catch (err) {
            adminToast(err.message, 'danger');
          }
        }
      });
    });
  }

  return {
    init,
    refresh: loadOrderDetails
  };
})();
