/**
 * ==============================================================================
 * BIG BASKET - ORDER MANAGEMENT & TRACKING CONTROLLER
 * ==============================================================================
 */

const BigBasketOrders = (function () {
  const STORAGE_KEY = 'bigbasket_orders_v1';

  const DEFAULT_ORDERS = [
    {
      id: 'BB102938',
      date: '21 August 2026, 04:30 PM',
      status: 'out_for_delivery', // 'placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered'
      statusLabel: 'Out for Delivery',
      eta: '10–15 mins',
      deliveryAddress: {
        name: 'Abhishek Sharma',
        phone: '+91 98765 43210',
        line: 'House #42, Near Old Bus Stand, Main Market Road, Satnali, Haryana - 123024'
      },
      paymentMethod: 'UPI (Google Pay)',
      items: [
        { id: 'prod-001', name: 'Amul Taaza Homogenised Toned Milk', weight: '1 L', qty: 2, price: 56, mrp: 62, emoji: '🥛' },
        { id: 'prod-020', name: 'Parle-G Gold Glucose Biscuits', weight: '1 kg', qty: 1, price: 95, mrp: 110, emoji: '🍪' },
        { id: 'prod-004', name: 'Britannia Cheese Slices (10 Slices)', weight: '200 g', qty: 1, price: 135, mrp: 155, emoji: '🧀' }
      ],
      subtotal: 342,
      discount: 47,
      deliveryFee: 0,
      total: 342
    },
    {
      id: 'BB102845',
      date: '18 August 2026, 11:15 AM',
      status: 'delivered',
      statusLabel: 'Delivered',
      eta: 'Delivered on 18 Aug, 11:32 AM',
      deliveryAddress: {
        name: 'Abhishek Sharma',
        phone: '+91 98765 43210',
        line: 'House #42, Near Old Bus Stand, Main Market Road, Satnali, Haryana - 123024'
      },
      paymentMethod: 'Cash on Delivery',
      items: [
        { id: 'prod-007', name: 'Aashirvaad Superior MP Sharbati Atta', weight: '5 kg', qty: 1, price: 245, mrp: 290, emoji: '🌾' },
        { id: 'prod-010', name: 'Fortune Sunlite Refined Sunflower Oil', weight: '1 L', qty: 1, price: 138, mrp: 175, emoji: '🌻' },
        { id: 'prod-009', name: 'Tata Sampann Unpolished Toor Dal', weight: '1 kg', qty: 1, price: 165, mrp: 195, emoji: '🥣' }
      ],
      subtotal: 548,
      discount: 112,
      deliveryFee: 0,
      total: 548
    },
    {
      id: 'BB101902',
      date: '12 August 2026, 07:45 PM',
      status: 'delivered',
      statusLabel: 'Delivered',
      eta: 'Delivered on 12 Aug, 08:04 PM',
      deliveryAddress: {
        name: 'Abhishek Sharma',
        phone: '+91 98765 43210',
        line: 'Shop #12, Railway Station Market, Satnali, Haryana - 123024'
      },
      paymentMethod: 'Credit Card (Visa ending in 4092)',
      items: [
        { id: 'prod-024', name: 'Cadbury Dairy Milk Silk Chocolate Bar', weight: '150 g', qty: 2, price: 165, mrp: 185, emoji: '🍫' },
        { id: 'prod-018', name: 'Nescafe Classic Instant Coffee Powder', weight: '100 g', qty: 1, price: 198, mrp: 230, emoji: '☕' },
        { id: 'prod-050', name: 'boAt Rockerz 255 Pro+ Wireless Neckband', weight: 'Active Black', qty: 1, price: 1199, mrp: 3990, emoji: '🎧' }
      ],
      subtotal: 1727,
      discount: 2883,
      deliveryFee: 0,
      total: 1727
    }
  ];

  function load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ORDERS));
      return DEFAULT_ORDERS;
    } catch (e) {
      console.warn('Error loading orders:', e);
      return DEFAULT_ORDERS;
    }
  }

  function save(orders) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.warn('Error saving orders:', e);
    }
  }

  function getOrders() {
    return load();
  }

  function getOrder(id) {
    const list = load();
    return list.find(o => o.id.toUpperCase() === id.toUpperCase()) || null;
  }

  function createOrder(orderData) {
    const list = load();
    const newOrder = {
      id: `BB${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'confirmed',
      statusLabel: 'Order Confirmed',
      eta: '10–15 mins',
      ...orderData
    };

    list.unshift(newOrder);
    save(list);
    return newOrder;
  }

  /**
   * Render Orders List in orders.html
   */
  function renderOrdersList(containerId = 'orders-list-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const list = getOrders();

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="text-align: center; padding: 4rem 1.5rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg);">
          <div style="font-size: 3.5rem; margin-bottom: 0.75rem;">📦</div>
          <h3>No Orders Placed Yet</h3>
          <p style="color: var(--color-text-secondary); margin-bottom: 1.5rem;">Explore fresh groceries and daily essentials with superfast 10-15 min delivery!</p>
          <a href="shop.html" class="btn btn-primary">Start Shopping</a>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(order => `
      <div class="order-history-card">
        <div class="order-card-header">
          <div>
            <span class="order-id-label">ORDER #${order.id}</span>
            <div class="order-date-text">Placed on ${order.date}</div>
          </div>
          <div>
            <span class="order-status-badge status-${order.status}">
              ${order.status === 'delivered' ? '✓ Delivered' : order.status === 'out_for_delivery' ? '● Out for Delivery' : '✓ ' + order.statusLabel}
            </span>
          </div>
        </div>

        <div class="order-card-body">
          <div class="order-items-preview">
            ${order.items.map(item => `
              <div class="order-item-chip" title="${item.name} (${item.qty}x)">
                <span class="item-art">${item.emoji}</span>
                <span class="item-qty-tag">x${item.qty}</span>
              </div>
            `).join('')}
          </div>

          <div class="order-price-col">
            <span class="order-total-price">₹${order.total}</span>
            <span class="order-items-count">${order.items.length} ${order.items.length === 1 ? 'item' : 'items'}</span>
          </div>
        </div>

        <div class="order-card-footer">
          <span style="font-size: 0.85rem; color: var(--color-text-secondary);">
            🚚 ${order.status === 'delivered' ? order.eta : '⚡ Estimated Arrival: ' + order.eta}
          </span>
          <a href="order-details.html?id=${order.id}" class="btn btn-secondary btn-sm">
            View Order Details →
          </a>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render Single Order Details Page in order-details.html
   */
  function renderOrderDetails(orderId) {
    const container = document.getElementById('order-detail-container');
    if (!container) return;

    const order = getOrder(orderId);

    if (!order) {
      container.innerHTML = `
        <div class="empty-state-card" style="text-align: center; padding: 4rem 1.5rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg);">
          <div style="font-size: 3rem; margin-bottom: 0.75rem;">🔍</div>
          <h2>Order Not Found</h2>
          <p style="color: var(--color-text-secondary); margin-bottom: 1.5rem;">Could not locate Order #${orderId}.</p>
          <a href="orders.html" class="btn btn-primary">Back to Orders</a>
        </div>
      `;
      return;
    }

    const steps = [
      { key: 'placed', label: 'Order Placed', desc: 'Received & verified' },
      { key: 'confirmed', label: 'Confirmed', desc: 'Accepted by Satnali Hub' },
      { key: 'packed', label: 'Packed', desc: 'Freshly packed & checked' },
      { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'On rider\'s bike' },
      { key: 'delivered', label: 'Delivered', desc: 'Arrived at your door' }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === order.status);
    const activeIndex = currentStepIndex !== -1 ? currentStepIndex : 1;

    container.innerHTML = `
      <!-- Top Order Header -->
      <div class="order-detail-header-card">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.4rem; font-weight: 800; margin: 0 0 0.25rem 0;">Order #${order.id}</h1>
            <span style="color: var(--color-text-muted); font-size: 0.85rem;">Placed on ${order.date}</span>
          </div>
          <span class="order-status-badge status-${order.status}" style="font-size: 0.95rem; padding: 0.4rem 1rem;">
            ${order.statusLabel}
          </span>
        </div>

        <!-- 5-Step Visual Timeline -->
        <div class="order-timeline-wrapper">
          <div class="timeline-steps-grid">
            ${steps.map((step, idx) => `
              <div class="timeline-step-item ${idx <= activeIndex ? 'completed' : ''} ${idx === activeIndex ? 'current' : ''}">
                <div class="step-circle">
                  ${idx <= activeIndex ? '✓' : (idx + 1)}
                </div>
                <div class="step-label">${step.label}</div>
                <div class="step-sub">${step.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Two-Column Order Content Grid -->
      <div class="order-detail-content-grid">
        <!-- Left: Items Table -->
        <div class="order-detail-items-card">
          <h2 style="font-size: 1.15rem; font-weight: 800; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border); margin: 0 0 1rem 0;">
            Ordered Items (${order.items.length})
          </h2>

          <div class="order-detail-items-list">
            ${order.items.map(item => `
              <div class="order-detail-item-row">
                <div class="item-art-box">${item.emoji}</div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-text-primary);">${item.name}</div>
                  <div style="font-size: 0.8rem; color: var(--color-text-muted);">${item.weight} • Qty: ${item.qty}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-weight: 800; font-size: 1rem; color: var(--color-text-primary);">₹${item.price * item.qty}</div>
                  ${item.mrp > item.price ? `<div style="font-size: 0.75rem; color: var(--color-text-muted); text-decoration: line-through;">₹${item.mrp * item.qty}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right: Address, Payment & Bill Summary -->
        <div class="order-detail-summary-side">
          <!-- Delivery Address Card -->
          <div class="order-sidebar-card">
            <h3 class="side-card-title">📍 Delivery Address</h3>
            <div style="font-size: 0.9rem; line-height: 1.5; color: var(--color-text-secondary);">
              <strong>${order.deliveryAddress.name}</strong><br>
              📞 ${order.deliveryAddress.phone}<br>
              ${order.deliveryAddress.line}
            </div>
          </div>

          <!-- Payment Info -->
          <div class="order-sidebar-card">
            <h3 class="side-card-title">💳 Payment Information</h3>
            <div style="font-size: 0.9rem; color: var(--color-text-secondary);">
              Method: <strong>${order.paymentMethod}</strong><br>
              Status: <span style="color: #16a34a; font-weight: 700;">Paid / Verified</span>
            </div>
          </div>

          <!-- Bill Breakdown -->
          <div class="order-sidebar-card">
            <h3 class="side-card-title">🧾 Bill Details</h3>
            <div class="summary-bill-row">
              <span>Item Total</span>
              <span>₹${order.subtotal}</span>
            </div>
            ${order.discount > 0 ? `
              <div class="summary-bill-row discount">
                <span>Discount Savings</span>
                <span>-₹${order.discount}</span>
              </div>
            ` : ''}
            <div class="summary-bill-row">
              <span>Delivery Fee</span>
              <span>${order.deliveryFee === 0 ? 'FREE' : '₹' + order.deliveryFee}</span>
            </div>
            <div class="summary-bill-row summary-grand-total">
              <span>Grand Total</span>
              <span>₹${order.total}</span>
            </div>

            ${(order.status === 'pending' || order.status === 'confirmed') ? `
              <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed var(--color-border); text-align: center;">
                <button type="button" class="btn btn-secondary btn-sm" style="color: #dc2626; border-color: #fca5a5; width: 100%;" onclick="BigBasketOrders.cancelOrderAction('${order.id}')">
                  <i class="fas fa-ban"></i> Cancel Order
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  async function cancelOrderAction(orderId) {
    if (!confirm('Are you sure you want to cancel this order? All items will be restocked.')) return;
    try {
      if (window.LocalMartAPI && window.LocalMartAPI.cancelOrder) {
        await window.LocalMartAPI.cancelOrder(orderId);
      }
      alert('Order cancelled successfully.');
      window.location.reload();
    } catch (e) {
      alert('Failed to cancel order: ' + e.message);
    }
  }

  return {
    getOrders,
    getOrder,
    createOrder,
    renderOrdersList,
    renderOrderDetails,
    cancelOrderAction
  };
})();

// Export globally
window.BigBasketOrders = BigBasketOrders;
