/**
 * ==============================================================================
 * BIG BASKET - CART STATE & DRAWER / CHECKOUT MANAGEMENT
 * ==============================================================================
 */

const LocalMartCart = (function () {
  const STORAGE_KEY = 'bigbasket_cart_v1';
  const FREE_DELIVERY_THRESHOLD = 299;
  const STANDARD_DELIVERY_FEE = 30;

  // Internal cart state
  let items = [];
  let appliedCoupon = null; // { code: 'BBFIRST', discount: 100 }

  function loadCart() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        items = JSON.parse(saved);
        if (!Array.isArray(items)) items = [];
      }
      const savedCoupon = localStorage.getItem('bigbasket_coupon_v1');
      if (savedCoupon) {
        appliedCoupon = JSON.parse(savedCoupon);
      }
    } catch (e) {
      console.warn('Error reading cart from localStorage', e);
      items = [];
    }

    // Attempt backend synchronization if authenticated
    syncBackendCart();
  }

  function saveCartLocallyOnly() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      if (appliedCoupon) {
        localStorage.setItem('bigbasket_coupon_v1', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('bigbasket_coupon_v1');
      }
    } catch (e) {
      console.warn('Error saving cart to localStorage', e);
    }
    updateCartUI();
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: { items, summary: getSummary() } }));
  }

  function saveCart() {
    saveCartLocallyOnly();
  }

  async function syncBackendCart() {
    const token = localStorage.getItem('bigbasket_auth_token') || sessionStorage.getItem('bigbasket_auth_token');
    if (!token || !window.LocalMartAPI) return;

    try {
      const res = await window.LocalMartAPI.getCart();
      if (res && res.success && res.data && Array.isArray(res.data.items)) {
        if (res.data.items.length > 0) {
          items = res.data.items.map(it => {
            const p = it.product || {};
            const pPrice = Number(it.unit_price || p.price || 0);
            return {
              id: Number(it.product_id),
              cart_item_id: it.id,
              name: p.name || 'Product',
              brand: p.brand || 'Big Basket',
              weight: p.weight || '',
              price: pPrice,
              sellingPrice: pPrice,
              mrp: Number(p.mrp || pPrice),
              emoji: p.emoji || '📦',
              image_url: (p.images && p.images[0]) ? p.images[0].image_url : null,
              quantity: Number(it.quantity)
            };
          });
          saveCartLocallyOnly();
        } else if (items.length > 0) {
          // Local cart has items, push to backend
          for (const item of items) {
            if (item && item.id) {
              await window.LocalMartAPI.addCartItem(item.id, item.quantity || 1);
            }
          }
          const freshRes = await window.LocalMartAPI.getCart();
          if (freshRes && freshRes.success && freshRes.data && Array.isArray(freshRes.data.items) && freshRes.data.items.length > 0) {
            items = freshRes.data.items.map(it => {
              const p = it.product || {};
              const pPrice = Number(it.unit_price || p.price || 0);
              return {
                id: Number(it.product_id),
                cart_item_id: it.id,
                name: p.name || 'Product',
                brand: p.brand || 'Big Basket',
                weight: p.weight || '',
                price: pPrice,
                sellingPrice: pPrice,
                mrp: Number(p.mrp || pPrice),
                emoji: p.emoji || '📦',
                image_url: (p.images && p.images[0]) ? p.images[0].image_url : null,
                quantity: Number(it.quantity)
              };
            });
            saveCartLocallyOnly();
          }
        }
      }
    } catch (e) {
      console.warn('Backend cart sync note:', e);
    }
  }

  function getSummary() {
    const totalCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const subtotal = items.reduce((sum, item) => sum + ((Number(item.sellingPrice) || Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const mrpTotal = items.reduce((sum, item) => sum + ((Number(item.mrp) || Number(item.sellingPrice) || Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const regularSavings = Math.max(0, mrpTotal - subtotal);

    let couponDiscount = 0;
    if (appliedCoupon && subtotal > 0) {
      couponDiscount = Math.min(Number(appliedCoupon.discount) || 0, subtotal);
    }

    const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0;
    const deliveryFee = isFreeDelivery ? 0 : STANDARD_DELIVERY_FEE;
    const finalTotal = Math.max(0, subtotal - couponDiscount + deliveryFee);
    const amountForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

    return {
      totalCount,
      subtotal,
      mrpTotal,
      savings: regularSavings,
      couponDiscount,
      appliedCoupon,
      deliveryFee,
      isFreeDelivery,
      finalTotal,
      amountForFreeDelivery,
      freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD
    };
  }

  async function addItem(product, qty = 1) {
    if (!product || !product.id) return;
    const prodId = Number(typeof product.id === 'string' ? product.id.replace(/^prod-0*/, '') : product.id);
    const rawPrice = Number(product.price || product.sellingPrice || 0);
    const rawMrp = Number(product.mrp || rawPrice);

    const existing = items.find(i => Number(i.id) === prodId);
    if (existing) {
      existing.quantity += qty;
    } else {
      items.push({
        id: prodId,
        name: product.name || 'Product',
        brand: product.brand || 'Big Basket',
        weight: product.weight || '',
        price: rawPrice,
        sellingPrice: rawPrice,
        mrp: rawMrp,
        emoji: product.emoji || '📦',
        image_url: product.image_url || (product.images && product.images[0] ? product.images[0].image_url : null),
        quantity: qty
      });
    }
    saveCart();

    const token = localStorage.getItem('bigbasket_auth_token') || sessionStorage.getItem('bigbasket_auth_token');
    if (token && window.LocalMartAPI) {
      try {
        const res = await window.LocalMartAPI.addCartItem(prodId, qty);
        if (res && res.success && res.data && Array.isArray(res.data.items)) {
          // Re-sync with authoritative database cart
          items = res.data.items.map(it => {
            const p = it.product || {};
            const pPrice = Number(it.unit_price || p.price || 0);
            return {
              id: Number(it.product_id),
              cart_item_id: it.id,
              name: p.name || 'Product',
              brand: p.brand || 'Big Basket',
              weight: p.weight || '',
              price: pPrice,
              sellingPrice: pPrice,
              mrp: Number(p.mrp || pPrice),
              emoji: p.emoji || '📦',
              image_url: (p.images && p.images[0]) ? p.images[0].image_url : null,
              quantity: Number(it.quantity)
            };
          });
          saveCartLocallyOnly();
        }
      } catch (e) {
        console.warn('addCartItem error:', e);
      }
    }
  }

  async function updateQuantity(productId, quantity) {
    const prodId = Number(typeof productId === 'string' ? productId.replace(/^prod-0*/, '') : productId);
    const index = items.findIndex(i => Number(i.id) === prodId);
    if (index !== -1) {
      if (quantity <= 0) {
        items.splice(index, 1);
      } else {
        items[index].quantity = quantity;
      }
      saveCart();

      const token = localStorage.getItem('bigbasket_auth_token') || sessionStorage.getItem('bigbasket_auth_token');
      if (token && window.LocalMartAPI) {
        try {
          if (quantity <= 0) {
            await window.LocalMartAPI.removeCartItem(prodId);
          } else {
            await window.LocalMartAPI.updateCartItem(prodId, quantity);
          }
        } catch (e) {
          console.warn('updateQuantity backend error:', e);
        }
      }
    }
  }

  async function removeItem(productId) {
    const prodId = Number(typeof productId === 'string' ? productId.replace(/^prod-0*/, '') : productId);
    items = items.filter(i => Number(i.id) !== prodId);
    saveCart();

    const token = localStorage.getItem('bigbasket_auth_token') || sessionStorage.getItem('bigbasket_auth_token');
    if (token && window.LocalMartAPI) {
      try {
        await window.LocalMartAPI.removeCartItem(prodId);
      } catch (e) {
        console.warn('removeItem backend error:', e);
      }
    }

    if (window.LocalMartUI) {
      window.LocalMartUI.showToast('Item removed from cart', 'info');
    }
  }

  async function clearCart() {
    items = [];
    appliedCoupon = null;
    saveCart();

    const token = localStorage.getItem('bigbasket_auth_token') || sessionStorage.getItem('bigbasket_auth_token');
    if (token && window.LocalMartAPI) {
      try {
        await window.LocalMartAPI.clearCart();
      } catch (e) {
        console.warn('clearCart backend error:', e);
      }
    }
  }

  function getItemQuantity(productId) {
    const item = items.find(i => i.id === productId);
    return item ? item.quantity : 0;
  }

  function applyCoupon(code) {
    if (!code) return { success: false, message: 'Please enter a coupon code' };
    const clean = code.toUpperCase().trim();

    if (clean === 'BBFIRST') {
      const summary = getSummary();
      if (summary.subtotal < 199) {
        return { success: false, message: 'Minimum order of ₹199 required for BBFIRST' };
      }
      appliedCoupon = { code: 'BBFIRST', discount: 100 };
      saveCart();
      return { success: true, message: 'Coupon BBFIRST applied! You saved ₹100 🎉' };
    }

    if (clean === 'FREEDEL') {
      appliedCoupon = { code: 'FREEDEL', discount: 30 };
      saveCart();
      return { success: true, message: 'Coupon FREEDEL applied! Free delivery unlocked 🚚' };
    }

    return { success: false, message: 'Invalid coupon code. Try BBFIRST' };
  }

  function removeCoupon() {
    appliedCoupon = null;
    saveCart();
  }

  function updateCartUI() {
    const summary = getSummary();

    // Update all badge counters
    document.querySelectorAll('.cart-badge-count, #header-cart-badge').forEach(el => {
      el.textContent = summary.totalCount;
    });

    // Update header price preview
    document.querySelectorAll('#header-cart-total').forEach(el => {
      el.textContent = `₹${summary.finalTotal}`;
    });

    // Update product card quantity steppers on page
    if (window.LocalMartProducts) {
      document.querySelectorAll('[data-product-id]').forEach(card => {
        const prodId = card.getAttribute('data-product-id');
        const qty = getItemQuantity(prodId);
        window.LocalMartProducts.updateProductCardControls(prodId, qty);
      });
    }

    renderDrawerContent();
    renderCartPage();
    renderCheckoutPage();
  }

  function renderDrawerContent() {
    const drawerItems = document.getElementById('cart-drawer-items');
    const drawerFooter = document.getElementById('cart-drawer-footer');
    const drawerItemCount = document.getElementById('drawer-item-count');
    const deliveryMeter = document.getElementById('free-delivery-meter');

    if (!drawerItems) return;

    const summary = getSummary();
    if (drawerItemCount) drawerItemCount.textContent = `(${summary.totalCount} items)`;

    if (items.length === 0) {
      drawerItems.innerHTML = `
        <div class="cart-empty-state" style="text-align: center; padding: 3rem 1.5rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🛒</div>
          <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--color-text-primary); margin-bottom: 0.5rem;">Your cart is empty</h3>
          <p style="font-size: 0.9rem; color: var(--color-text-secondary); margin-bottom: 1.5rem;">Explore thousands of fresh items at lowest prices!</p>
          <a href="shop.html" class="btn btn-primary" onclick="LocalMartCart.closeDrawer()">Start Shopping</a>
        </div>
      `;
      if (drawerFooter) drawerFooter.style.display = 'none';
      if (deliveryMeter) deliveryMeter.style.display = 'none';
      return;
    }

    if (drawerFooter) drawerFooter.style.display = 'block';
    if (deliveryMeter) {
      deliveryMeter.style.display = 'block';
      const meterText = document.getElementById('delivery-meter-text');
      const meterFill = document.getElementById('delivery-progress-fill');
      if (summary.isFreeDelivery) {
        if (meterText) meterText.innerHTML = `🎉 You unlocked <strong>FREE Delivery</strong>!`;
        if (meterFill) meterFill.style.width = `100%`;
      } else {
        const pct = Math.min(100, Math.round((summary.subtotal / summary.freeDeliveryThreshold) * 100));
        if (meterText) meterText.innerHTML = `Add ₹${summary.amountForFreeDelivery} more for <strong>FREE Delivery</strong> 🚚`;
        if (meterFill) meterFill.style.width = `${pct}%`;
      }
    }

    drawerItems.innerHTML = `
      <ul class="cart-items-list" style="list-style: none; padding: 0; margin: 0;">
        ${items.map(item => `
          <li style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 0; border-bottom: 1px solid var(--color-border-subtle); gap: 0.75rem;">
            <div style="width: 46px; height: 46px; background: var(--color-background-alt); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 1.6rem; flex-shrink: 0; border: 1px solid var(--color-border);">
              ${item.emoji}
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 0.88rem; font-weight: 700; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
              <div style="font-size: 0.78rem; color: var(--color-text-secondary);">${item.weight} • <strong style="color: var(--color-text-primary);">₹${item.sellingPrice}</strong></div>
            </div>
            <div class="qty-stepper active" style="height: 30px;">
              <button type="button" class="qty-btn" onclick="LocalMartCart.updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
              <span class="qty-value">${item.quantity}</span>
              <button type="button" class="qty-btn" onclick="LocalMartCart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
            </div>
          </li>
        `).join('')}
      </ul>
    `;

    // Bill Details
    const subtotalEl = document.getElementById('bill-subtotal');
    const discountEl = document.getElementById('bill-discount');
    const feeEl = document.getElementById('bill-delivery-fee');
    const grandEl = document.getElementById('bill-grand-total');

    if (subtotalEl) subtotalEl.textContent = `₹${summary.subtotal}`;
    if (discountEl) discountEl.textContent = `-₹${summary.savings + summary.couponDiscount}`;
    if (feeEl) feeEl.textContent = summary.isFreeDelivery ? 'FREE' : `₹${summary.deliveryFee}`;
    if (grandEl) grandEl.textContent = `₹${summary.finalTotal}`;
  }

  function renderCartPage() {
    const tableContainer = document.getElementById('cart-page-items-container');
    const emptyState = document.getElementById('cart-page-empty');
    const summaryCard = document.getElementById('cart-page-summary');

    if (!tableContainer) return;
    const summary = getSummary();

    if (items.length === 0) {
      tableContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      if (summaryCard) summaryCard.style.display = 'none';
      return;
    }

    tableContainer.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    if (summaryCard) summaryCard.style.display = 'block';

    tableContainer.innerHTML = items.map(item => `
      <div class="cart-table-item">
        <div class="cart-table-art">${item.emoji}</div>
        <div class="cart-table-info">
          <span class="cart-table-brand">${item.brand || 'Big Basket'}</span>
          <h3><a href="product.html?id=${item.id}">${item.name}</a></h3>
          <span style="font-size: 0.85rem; color: var(--color-text-secondary);">${item.weight} • ₹${item.sellingPrice} each</span>
        </div>
        <div class="qty-stepper active">
          <button type="button" class="qty-btn" onclick="LocalMartCart.updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button type="button" class="qty-btn" onclick="LocalMartCart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
        </div>
        <div class="cart-table-price">₹${item.sellingPrice * item.quantity}</div>
        <button type="button" class="cart-table-remove-btn" onclick="LocalMartCart.removeItem('${item.id}')" title="Remove item">🗑️</button>
      </div>
    `).join('');

    // Summary
    const pageSubtotal = document.getElementById('cart-page-subtotal');
    const pageDiscount = document.getElementById('cart-page-discount');
    const pageCouponDiscount = document.getElementById('cart-page-coupon-discount');
    const pageDeliveryFee = document.getElementById('cart-page-delivery');
    const pageGrandTotal = document.getElementById('cart-page-total');

    if (pageSubtotal) pageSubtotal.textContent = `₹${summary.subtotal}`;
    if (pageDiscount) pageDiscount.textContent = `-₹${summary.savings}`;
    if (pageCouponDiscount) {
      if (summary.couponDiscount > 0) {
        pageCouponDiscount.parentElement.style.display = 'flex';
        pageCouponDiscount.textContent = `-₹${summary.couponDiscount}`;
      } else {
        pageCouponDiscount.parentElement.style.display = 'none';
      }
    }
    if (pageDeliveryFee) pageDeliveryFee.textContent = summary.isFreeDelivery ? 'FREE' : `₹${summary.deliveryFee}`;
    if (pageGrandTotal) pageGrandTotal.textContent = `₹${summary.finalTotal}`;
  }

  function renderCheckoutPage() {
    const checkoutItemsList = document.getElementById('checkout-items-list');
    const checkoutSubtotal = document.getElementById('checkout-subtotal');
    const checkoutDelivery = document.getElementById('checkout-delivery');
    const checkoutDiscount = document.getElementById('checkout-discount');
    const checkoutTotal = document.getElementById('checkout-total');

    if (!checkoutItemsList) return;
    const summary = getSummary();

    checkoutItemsList.innerHTML = items.map(item => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid var(--color-border-subtle); font-size: 0.9rem;">
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <span>${item.emoji}</span>
          <span style="font-weight: 600;">${item.name} <span style="color: var(--color-text-muted); font-size: 0.8rem;">(x${item.quantity})</span></span>
        </div>
        <div style="font-weight: 700;">₹${item.sellingPrice * item.quantity}</div>
      </div>
    `).join('');

    if (checkoutSubtotal) checkoutSubtotal.textContent = `₹${summary.subtotal}`;
    if (checkoutDelivery) checkoutDelivery.textContent = summary.isFreeDelivery ? 'FREE' : `₹${summary.deliveryFee}`;
    if (checkoutDiscount) checkoutDiscount.textContent = `-₹${summary.savings + summary.couponDiscount}`;
    if (checkoutTotal) checkoutTotal.textContent = `₹${summary.finalTotal}`;
  }

  function openDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer && overlay) {
      drawer.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      renderDrawerContent();
    }
  }

  function closeDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer && overlay) {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function init() {
    loadCart();
    updateCartUI();

    // Bind all cart toggle buttons
    document.querySelectorAll('.cart-btn, #header-cart-btn, .cart-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openDrawer();
      });
    });

    const overlay = document.getElementById('cart-drawer-overlay');
    if (overlay) {
      overlay.addEventListener('click', closeDrawer);
    }

    const closeBtn = document.getElementById('cart-drawer-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeDrawer);
    }
  }

  return {
    init,
    getItems: () => [...items],
    syncBackendCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    clear: clearCart,
    getItemQuantity,
    getSummary,
    applyCoupon,
    removeCoupon,
    openDrawer,
    closeDrawer,
    updateCartUI
  };
})();

// Export globally
window.LocalMartCart = LocalMartCart;
window.BigBasketCart = LocalMartCart;
