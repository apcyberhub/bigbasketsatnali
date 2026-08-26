/**
 * ==============================================================================
 * BIG BASKET - PRODUCT CARD, QUICK VIEW & CAROUSEL COMPONENT
 * ==============================================================================
 */

const LocalMartProducts = (function () {
  /**
   * Generates HTML for a single reusable product card
   */
  function createProductCardHTML(product) {
    if (!product) return '';

    const inCartQty = window.LocalMartCart ? window.LocalMartCart.getItemQuantity(product.id) : 0;
    const isWishlisted = window.BigBasketWishlist ? window.BigBasketWishlist.has(product.id) : false;
    const discountPercent = product.discount || (product.mrp && product.sellingPrice ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) : 0);
    const isOutOfStock = (product.stock !== undefined && product.stock <= 0) || (product.inStock === false) || (product.stock_quantity !== undefined && product.stock_quantity <= 0);
    const imgUrl = product.image_url || (product.images && product.images.length > 0 ? product.images[0].image_url : null);

    return `
      <article class="product-card" data-product-id="${product.id}" aria-label="${product.name}">
        <!-- Top Action & Badges Strip -->
        <div class="card-top-strip">
          <div class="card-badges">
            ${isOutOfStock ? `<span class="badge badge-out-of-stock">OUT OF STOCK</span>` : ''}
            ${!isOutOfStock && discountPercent > 0 ? `<span class="badge badge-discount">${discountPercent}% OFF</span>` : ''}
            ${!isOutOfStock && product.badge && !product.badge.includes('%') ? `<span class="badge badge-fresh">${product.badge}</span>` : ''}
          </div>
          
          <div class="card-action-icons">
            <button type="button" class="card-icon-btn card-quickview-btn" onclick="LocalMartProducts.openQuickView('${product.id}')" title="Quick View" aria-label="Quick view ${product.name}">
              👁️
            </button>
            <button type="button" class="card-icon-btn card-wishlist-btn ${isWishlisted ? 'active' : ''}" data-wishlist-id="${product.id}" onclick="BigBasketWishlist.toggle('${product.id}', '${product.name.replace(/'/g, "\\'")}')" title="Save to Wishlist" aria-label="Toggle Wishlist">
              ${isWishlisted ? '❤️' : '🤍'}
            </button>
          </div>
        </div>

        <!-- Product Image / Artwork Box -->
        <div class="product-image-box">
          <a href="product.html?id=${product.id}" class="product-link" aria-label="View ${product.name}">
            ${imgUrl ? `<img src="${imgUrl}" alt="${product.name}" class="product-card-img" style="width: 100%; height: 130px; object-fit: contain;" onerror="this.outerHTML='<div class=\\'product-art\\'>${product.emoji || '📦'}</div>';">` : `<div class="product-art">${product.emoji || '📦'}</div>`}
          </a>
          <span class="product-eta-tag">⚡ ${product.eta || '15 mins'}</span>
        </div>

        <!-- Product Details -->
        <div class="product-details">
          <span class="product-brand">${product.brand || 'Big Basket'}</span>
          <h3 class="product-name">
            <a href="product.html?id=${product.id}">${product.name}</a>
          </h3>
          <span class="product-weight">${product.weight || '1 Unit'}</span>

          <!-- Rating -->
          <div class="product-rating-row">
            <span class="rating-pill">
              ★ ${product.rating || '4.5'}
            </span>
            <span class="rating-count">(${product.reviewCount ? (typeof product.reviewCount === 'number' && product.reviewCount > 999 ? (product.reviewCount/1000).toFixed(1)+'k' : product.reviewCount) : '120'})</span>
          </div>

          <!-- Price & Add Button Row -->
          <div class="product-card-bottom">
            <div class="price-group">
              <span class="selling-price">₹${product.sellingPrice}</span>
              ${product.mrp && product.mrp > product.sellingPrice ? `<span class="mrp-price">₹${product.mrp}</span>` : ''}
            </div>

            <div class="action-wrap">
              ${isOutOfStock ? `
                <button type="button" class="add-btn out-of-stock" disabled title="Item currently out of stock">
                  OUT OF STOCK
                </button>
              ` : `
                <!-- Add to Cart CTA -->
                <button type="button" class="add-btn ${inCartQty > 0 ? 'hidden' : ''}" onclick="LocalMartProducts.handleAddToCart('${product.id}')" aria-label="Add ${product.name} to cart">
                  ADD
                </button>

                <!-- Quantity Stepper Controls -->
                <div class="qty-stepper ${inCartQty > 0 ? 'active' : ''}">
                  <button type="button" class="qty-btn qty-minus" onclick="LocalMartProducts.handleDecrement('${product.id}')" aria-label="Decrease quantity">−</button>
                  <span class="qty-value">${inCartQty}</span>
                  <button type="button" class="qty-btn qty-plus" onclick="LocalMartProducts.handleIncrement('${product.id}')" aria-label="Increase quantity">+</button>
                </div>
              `}
            </div>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Render products into a horizontal carousel container
   */
  function renderProductList(containerId, products) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!products || products.length === 0) {
      container.innerHTML = `<div class="empty-list-msg">No products available in this section.</div>`;
      return;
    }

    container.innerHTML = products.map(createProductCardHTML).join('');
  }

  /**
   * Render products into a grid container
   */
  function renderProductGrid(containerId, products, append = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!append && (!products || products.length === 0)) {
      container.innerHTML = `
        <div class="empty-catalog-state">
          <div class="empty-icon">🔍</div>
          <h3>No products found</h3>
          <p>Try clearing your filters or searching for another grocery keyword.</p>
          <button class="btn btn-primary btn-sm" onclick="if(window.BigBasketShop) BigBasketShop.resetFilters()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    const html = products.map(createProductCardHTML).join('');
    if (append) {
      container.insertAdjacentHTML('beforeend', html);
    } else {
      container.innerHTML = html;
    }
  }

  /**
   * Carousel arrow scroll controls
   */
  function setupCarouselControls(sectionElement) {
    if (!sectionElement) return;

    const carousel = sectionElement.querySelector('.product-carousel');
    const prevBtn = sectionElement.querySelector('.carousel-btn-prev');
    const nextBtn = sectionElement.querySelector('.carousel-btn-next');

    if (!carousel || !prevBtn || !nextBtn) return;

    const scrollAmount = 240 * 2; // scroll 2 cards

    function updateArrowStates() {
      const atStart = carousel.scrollLeft <= 10;
      const atEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 10;

      prevBtn.disabled = atStart;
      nextBtn.disabled = atEnd;
    }

    prevBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    carousel.addEventListener('scroll', updateArrowStates, { passive: true });
    updateArrowStates();
  }

  /**
   * Add to Cart handler
   */
  async function handleAddToCart(productId) {
    if (window.LocalMartAPI && window.LocalMartCart) {
      try {
        const prod = await window.LocalMartAPI.getProduct(productId);
        if (prod) {
          window.LocalMartCart.addItem(prod, 1);
          updateProductCardControls(productId, 1);
          if (window.LocalMartUI && typeof window.LocalMartUI.showToast === 'function') {
            window.LocalMartUI.showToast(`✓ Added ${prod.name} to Cart!`, 'success');
          }
        }
      } catch (e) {
        console.error('Failed to add product to cart:', e);
      }
    }
  }

  /**
   * Increment Quantity handler
   */
  function handleIncrement(productId) {
    if (window.LocalMartCart) {
      const current = window.LocalMartCart.getItemQuantity(productId);
      window.LocalMartCart.updateQuantity(productId, current + 1);
      updateProductCardControls(productId, current + 1);
    }
  }

  /**
   * Decrement Quantity handler
   */
  function handleDecrement(productId) {
    if (window.LocalMartCart) {
      const current = window.LocalMartCart.getItemQuantity(productId);
      const newQty = Math.max(0, current - 1);
      window.LocalMartCart.updateQuantity(productId, newQty);
      updateProductCardControls(productId, newQty);
    }
  }

  /**
   * Updates button/stepper state for a specific product across all rendered cards
   */
  function updateProductCardControls(productId, quantity) {
    document.querySelectorAll(`.product-card[data-product-id="${productId}"]`).forEach(card => {
      const addBtn = card.querySelector('.add-btn');
      const qtyStepper = card.querySelector('.qty-stepper');
      const qtyValue = card.querySelector('.qty-value');

      if (quantity > 0) {
        if (addBtn) addBtn.classList.add('hidden');
        if (qtyStepper) qtyStepper.classList.add('active');
        if (qtyValue) qtyValue.textContent = quantity;
      } else {
        if (addBtn) addBtn.classList.remove('hidden');
        if (qtyStepper) qtyStepper.classList.remove('active');
      }
    });

    // Also update quick view modal if currently open for this product
    const qvModal = document.getElementById('quick-view-modal');
    if (qvModal && qvModal.dataset.activeProductId === productId) {
      const qvAddBtn = qvModal.querySelector('.qv-add-btn');
      const qvStepper = qvModal.querySelector('.qv-stepper');
      const qvQtyValue = qvModal.querySelector('.qv-qty-value');

      if (quantity > 0) {
        if (qvAddBtn) qvAddBtn.classList.add('hidden');
        if (qvStepper) qvStepper.classList.add('active');
        if (qvQtyValue) qvQtyValue.textContent = quantity;
      } else {
        if (qvAddBtn) qvAddBtn.classList.remove('hidden');
        if (qvStepper) qvStepper.classList.remove('active');
      }
    }
  }

  /**
   * Quick View Modal Popup
   */
  async function openQuickView(productId) {
    if (!window.LocalMartAPI) return;

    try {
      const product = await window.LocalMartAPI.getProduct(productId);
      let modal = document.getElementById('quick-view-modal');

      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'quick-view-modal';
        modal.className = 'modal-overlay qv-modal-overlay';
        document.body.appendChild(modal);
      }

      modal.dataset.activeProductId = product.id;
      const inCartQty = window.LocalMartCart ? window.LocalMartCart.getItemQuantity(product.id) : 0;
      const discountPercent = product.discount || (product.mrp && product.sellingPrice ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) : 0);

      modal.innerHTML = `
        <div class="modal-dialog qv-modal-dialog">
          <div class="qv-modal-header">
            <span class="badge badge-fresh">Quick View</span>
            <button class="modal-close" onclick="LocalMartProducts.closeQuickView()" aria-label="Close">✕</button>
          </div>
          
          <div class="qv-modal-body">
            <div class="qv-image-side">
              <div class="qv-product-art">${product.emoji || '📦'}</div>
              <span class="product-eta-tag" style="position: static; margin-top: 0.5rem; display: inline-flex;">⚡ Express ${product.eta || '15 mins'}</span>
            </div>

            <div class="qv-info-side">
              <span class="product-brand">${product.brand}</span>
              <h2 class="qv-title">${product.name}</h2>
              <div class="product-weight" style="margin-bottom: 0.5rem;">${product.weight}</div>
              
              <div class="product-rating-row" style="margin-bottom: 0.75rem;">
                <span class="rating-pill">★ ${product.rating}</span>
                <span class="rating-count">(${product.reviewCount || 120} verified reviews)</span>
              </div>

              <div class="qv-price-row">
                <span class="qv-selling-price">₹${product.sellingPrice}</span>
                ${product.mrp && product.mrp > product.sellingPrice ? `<span class="qv-mrp-price">₹${product.mrp}</span>` : ''}
                ${discountPercent > 0 ? `<span class="badge badge-discount">${discountPercent}% OFF</span>` : ''}
              </div>

              <p class="qv-desc">${product.description || 'Fresh and high quality grocery item handpicked from local verified markets.'}</p>

              <div class="qv-actions-row">
                <button type="button" class="btn btn-primary qv-add-btn ${inCartQty > 0 ? 'hidden' : ''}" onclick="LocalMartProducts.handleAddToCart('${product.id}')">
                  🛒 Add to Cart
                </button>

                <div class="qty-stepper qv-stepper ${inCartQty > 0 ? 'active' : ''}">
                  <button type="button" class="qty-btn" onclick="LocalMartProducts.handleDecrement('${product.id}')">−</button>
                  <span class="qty-value qv-qty-value">${inCartQty}</span>
                  <button type="button" class="qty-btn" onclick="LocalMartProducts.handleIncrement('${product.id}')">+</button>
                </div>

                <a href="product.html?id=${product.id}" class="btn btn-secondary">
                  View Full Details →
                </a>
              </div>
            </div>
          </div>
        </div>
      `;

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Close on backdrop click
      modal.onclick = (e) => {
        if (e.target === modal) closeQuickView();
      };
    } catch (e) {
      console.error('Error opening quick view:', e);
    }
  }

  function closeQuickView() {
    const modal = document.getElementById('quick-view-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  return {
    createProductCardHTML,
    renderProductList,
    renderProductGrid,
    setupCarouselControls,
    handleAddToCart,
    handleIncrement,
    handleDecrement,
    updateProductCardControls,
    openQuickView,
    closeQuickView
  };
})();

// Export globally
window.LocalMartProducts = LocalMartProducts;
window.BigBasketProducts = LocalMartProducts;
