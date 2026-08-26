/**
 * ==============================================================================
 * BIG BASKET - PRODUCT DETAILS CONTROLLER
 * ==============================================================================
 */

const BigBasketProductDetail = (function () {
  let currentProduct = null;
  let selectedQty = 1;
  let bundleItems = [];

  function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || 'prod-001';
  }

  async function init() {
    // 1. Initialize core managers
    if (window.BigBasketWishlist) window.BigBasketWishlist.init();
    if (window.BigBasketRecentlyViewed) window.BigBasketRecentlyViewed.init();
    if (window.LocalMartCart) window.LocalMartCart.init();
    if (window.LocalMartHeader) window.LocalMartHeader.init();
    if (window.LocalMartSearch) window.LocalMartSearch.init();
    if (window.LocalMartLocation) window.LocalMartLocation.init();

    const productId = getProductIdFromUrl();

    try {
      // 2. Fetch product from API
      currentProduct = await window.LocalMartAPI.getProduct(productId);

      // 3. Track in Recently Viewed
      if (window.BigBasketRecentlyViewed) {
        window.BigBasketRecentlyViewed.add(currentProduct.id);
      }

      // 4. Render product sections
      renderProductInfo(currentProduct);
      renderGallery(currentProduct);
      renderTabs(currentProduct);
      renderDeliveryChecker();

      // 5. Render Bundle & Related Items
      await loadFrequentlyBought(currentProduct.id);
      await loadRelatedProducts(currentProduct.id);
      await loadRecentlyViewed(currentProduct.id);

      // 6. Bind Tab Switching
      bindTabs();
    } catch (e) {
      console.error('Error loading product details:', e);
      renderNotFoundState();
    }
  }

  /**
   * Render Breadcrumb, Title, Price, Ratings & Buy Box
   */
  function renderProductInfo(p) {
    document.title = `${p.name} — Big Basket Satnali`;

    // Breadcrumb
    const bcCat = document.getElementById('bc-category');
    const bcProd = document.getElementById('bc-product-name');
    if (bcCat) {
      bcCat.innerHTML = `<a href="shop.html?category=${p.category}">${p.category.replace(/-/g, ' ')}</a>`;
    }
    if (bcProd) {
      bcProd.textContent = p.name;
    }

    // Brand & Title
    const brandEl = document.getElementById('product-brand-display');
    const titleEl = document.getElementById('product-title-display');
    const weightEl = document.getElementById('product-weight-display');
    if (brandEl) brandEl.textContent = p.brand;
    if (titleEl) titleEl.textContent = p.name;
    if (weightEl) weightEl.textContent = p.weight;

    // Rating
    const ratingPill = document.getElementById('product-rating-pill');
    const ratingCount = document.getElementById('product-rating-reviews');
    if (ratingPill) ratingPill.textContent = `★ ${p.rating}`;
    if (ratingCount) ratingCount.textContent = `(${p.reviewCount ? p.reviewCount.toLocaleString() : '120'} ratings)`;

    // Price & Savings
    const sellingPriceEl = document.getElementById('product-selling-price');
    const mrpPriceEl = document.getElementById('product-mrp-price');
    const saveBadgeEl = document.getElementById('product-save-badge');

    if (sellingPriceEl) sellingPriceEl.textContent = `₹${p.sellingPrice}`;
    if (mrpPriceEl) {
      if (p.mrp && p.mrp > p.sellingPrice) {
        mrpPriceEl.textContent = `₹${p.mrp}`;
        mrpPriceEl.style.display = 'inline';
      } else {
        mrpPriceEl.style.display = 'none';
      }
    }
    if (saveBadgeEl) {
      const savings = p.mrp && p.mrp > p.sellingPrice ? (p.mrp - p.sellingPrice) : 0;
      if (savings > 0) {
        saveBadgeEl.textContent = `Save ₹${savings} (${p.discount || Math.round((savings/p.mrp)*100)}% OFF)`;
        saveBadgeEl.style.display = 'inline-block';
      } else {
        saveBadgeEl.style.display = 'none';
      }
    }

    // Out of Stock handling
    const isOutOfStock = (p.stock !== undefined && p.stock <= 0) || (p.inStock === false) || (p.stock_quantity !== undefined && p.stock_quantity <= 0);
    const addToCartBtn = document.getElementById('btn-detail-add-cart');
    const buyNowBtn = document.getElementById('btn-detail-buynow');
    const stockStatusDisplay = document.getElementById('stock-status-display');

    if (isOutOfStock) {
      if (addToCartBtn) {
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = 'Out of Stock';
        addToCartBtn.style.opacity = '0.5';
        addToCartBtn.style.cursor = 'not-allowed';
      }
      if (buyNowBtn) {
        buyNowBtn.disabled = true;
        buyNowBtn.style.opacity = '0.5';
        buyNowBtn.style.cursor = 'not-allowed';
      }
      if (stockStatusDisplay) {
        stockStatusDisplay.innerHTML = '<span style="color: #ef4444; font-weight: 700;">❌ Out of Stock</span>';
      }
    } else {
      if (addToCartBtn) {
        addToCartBtn.disabled = false;
        addToCartBtn.innerHTML = '🛒 Add to Cart';
        addToCartBtn.style.opacity = '1';
        addToCartBtn.style.cursor = 'pointer';
      }
      if (buyNowBtn) {
        buyNowBtn.disabled = false;
        buyNowBtn.style.opacity = '1';
        buyNowBtn.style.cursor = 'pointer';
      }
      if (stockStatusDisplay) {
        stockStatusDisplay.innerHTML = '<span style="color: #10b981; font-weight: 700;">✅ In Stock & Ready to Deliver</span>';
      }
    }

    // Quantity & Cart Button setup
    const qtyInput = document.getElementById('detail-qty-val');
    if (qtyInput) qtyInput.value = selectedQty;

    // Wishlist state
    const wishlistBtn = document.getElementById('btn-detail-wishlist');
    if (wishlistBtn && window.BigBasketWishlist) {
      const isFav = window.BigBasketWishlist.has(p.id);
      wishlistBtn.innerHTML = isFav ? '❤️' : '🤍';
      wishlistBtn.onclick = () => {
        const added = window.BigBasketWishlist.toggle(p.id, p.name);
        wishlistBtn.innerHTML = added ? '❤️' : '🤍';
      };
    }
  }

  /**
   * Render Main Art & Gallery Thumbnails
   */
  function renderGallery(p) {
    const mainArt = document.getElementById('gallery-main-emoji');
    const thumbContainer = document.getElementById('gallery-thumbnails');
    const discountBadge = document.getElementById('gallery-discount-badge');

    if (mainArt) mainArt.textContent = p.emoji || '📦';
    if (discountBadge) {
      if (p.discount > 0) {
        discountBadge.textContent = `${p.discount}% OFF`;
        discountBadge.style.display = 'block';
      } else {
        discountBadge.style.display = 'none';
      }
    }

    const images = p.galleryImages && p.galleryImages.length > 0 ? p.galleryImages : [p.emoji || '📦'];
    if (thumbContainer) {
      thumbContainer.innerHTML = images.map((art, idx) => `
        <button type="button" class="gallery-thumb-btn ${idx === 0 ? 'active' : ''}" onclick="BigBasketProductDetail.setGalleryArt('${art}', this)" aria-label="View product visual ${idx + 1}">
          ${art}
        </button>
      `).join('');
    }
  }

  function setGalleryArt(art, btn) {
    const mainArt = document.getElementById('gallery-main-emoji');
    if (mainArt) mainArt.textContent = art;

    document.querySelectorAll('.gallery-thumb-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }

  /**
   * Tabs Rendering
   */
  function renderTabs(p) {
    const descPanel = document.getElementById('tab-panel-desc');
    const highlightsPanel = document.getElementById('tab-panel-highlights');
    const specsPanel = document.getElementById('tab-panel-specs');

    if (descPanel) {
      descPanel.innerHTML = `
        <p style="font-size: 1rem; line-height: 1.7; color: var(--color-text-secondary);">
          ${p.description || 'Premium quality product verified and freshly packed for maximum nutritional value.'}
        </p>
      `;
    }

    if (highlightsPanel) {
      const hl = p.highlights || ['100% Genuine and authentic', 'Locally sourced and quality tested', 'Safe, hygienic food grade packaging', 'Guaranteed fresh delivery'];
      highlightsPanel.innerHTML = `
        <ul style="list-style: disc; padding-left: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; color: var(--color-text-secondary);">
          ${hl.map(item => `<li style="font-size: 0.95rem;">${item}</li>`).join('')}
        </ul>
      `;
    }

    if (specsPanel) {
      const specs = p.specifications || { 'Brand': p.brand, 'Category': p.category, 'Country of Origin': 'India' };
      specsPanel.innerHTML = `
        <table class="product-specs-table">
          <tbody>
            ${Object.entries(specs).map(([k, v]) => `
              <tr>
                <th>${k}</th>
                <td>${v}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  }

  function bindTabs() {
    document.querySelectorAll('.tab-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content-panel').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.dataset.tabTarget;
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });
  }

  /**
   * Pincode Checker
   */
  function renderDeliveryChecker() {
    const checkBtn = document.getElementById('btn-check-pincode');
    const pinInput = document.getElementById('delivery-pincode-input');
    const feedback = document.getElementById('pincode-check-feedback');

    if (checkBtn && pinInput) {
      checkBtn.addEventListener('click', () => {
        const val = pinInput.value.trim();
        if (/^\d{6}$/.test(val)) {
          feedback.className = 'checker-feedback success';
          feedback.innerHTML = `⚡ Fast Delivery in <strong>10–15 Mins</strong> available for Pincode ${val}!`;
        } else {
          feedback.className = 'checker-feedback error';
          feedback.textContent = 'Please enter a valid 6-digit local pincode.';
        }
      });
    }
  }

  /**
   * Frequently Bought Together Bundle
   */
  async function loadFrequentlyBought(productId) {
    const container = document.getElementById('frequently-bought-section');
    if (!container) return;

    try {
      bundleItems = await window.LocalMartAPI.getFrequentlyBought(productId);
      if (bundleItems.length < 2) {
        container.style.display = 'none';
        return;
      }

      container.style.display = 'block';
      renderBundle();
    } catch (e) {
      console.error('Error loading bundle:', e);
      container.style.display = 'none';
    }
  }

  function renderBundle() {
    const itemsRow = document.getElementById('bundle-items-container');
    if (!itemsRow) return;

    itemsRow.innerHTML = bundleItems.map((item, idx) => `
      <div class="bundle-item-card">
        <input type="checkbox" class="bundle-item-checkbox" data-bundle-index="${idx}" checked onchange="BigBasketProductDetail.updateBundleTotal()">
        <div class="bundle-item-art">${item.emoji || '📦'}</div>
        <div>
          <div class="bundle-item-name">${item.name}</div>
          <div class="bundle-item-price">₹${item.sellingPrice}</div>
        </div>
      </div>
      ${idx < bundleItems.length - 1 ? '<div class="bundle-plus-sign">+</div>' : ''}
    `).join('');

    updateBundleTotal();
  }

  function updateBundleTotal() {
    let total = 0;
    let checkedCount = 0;

    document.querySelectorAll('.bundle-item-checkbox').forEach(cb => {
      if (cb.checked) {
        const idx = Number(cb.dataset.bundleIndex);
        if (bundleItems[idx]) {
          total += bundleItems[idx].sellingPrice;
          checkedCount++;
        }
      }
    });

    const totalEl = document.getElementById('bundle-total-amount');
    const ctaBtn = document.getElementById('btn-add-bundle-cart');

    if (totalEl) totalEl.textContent = `₹${total}`;
    if (ctaBtn) {
      ctaBtn.disabled = checkedCount === 0;
      ctaBtn.textContent = `Add Selected (${checkedCount} items) to Cart`;
    }
  }

  function addBundleToCart() {
    if (!window.LocalMartCart) return;

    let addedCount = 0;
    document.querySelectorAll('.bundle-item-checkbox').forEach(cb => {
      if (cb.checked) {
        const idx = Number(cb.dataset.bundleIndex);
        const item = bundleItems[idx];
        if (item) {
          window.LocalMartCart.addItem(item, 1);
          addedCount++;
        }
      }
    });

    if (window.LocalMartUI) {
      window.LocalMartUI.showToast(`Added bundle (${addedCount} items) to Cart! 🛒`, 'success');
    }
  }

  /**
   * Related Products Carousel
   */
  async function loadRelatedProducts(productId) {
    const container = document.getElementById('related-products-carousel');
    const section = document.getElementById('related-products-section');
    if (!container || !section) return;

    try {
      const related = await window.LocalMartAPI.getRelatedProducts(productId, 6);
      if (window.LocalMartProducts) {
        window.LocalMartProducts.renderProductList('related-products-carousel', related);
        window.LocalMartProducts.setupCarouselControls(section);
      }
    } catch (e) {
      console.error('Error loading related products:', e);
    }
  }

  /**
   * Recently Viewed Carousel
   */
  async function loadRecentlyViewed(productId) {
    const container = document.getElementById('recent-products-carousel');
    const section = document.getElementById('recent-products-section');
    if (!container || !section) return;

    try {
      if (window.BigBasketRecentlyViewed) {
        const recent = await window.BigBasketRecentlyViewed.getProducts(productId);
        if (recent.length > 0) {
          section.style.display = 'block';
          if (window.LocalMartProducts) {
            window.LocalMartProducts.renderProductList('recent-products-carousel', recent);
            window.LocalMartProducts.setupCarouselControls(section);
          }
        } else {
          section.style.display = 'none';
        }
      }
    } catch (e) {
      console.error('Error loading recently viewed:', e);
      section.style.display = 'none';
    }
  }

  /**
   * Quantity Steppers on Product Page
   */
  function changeQty(delta) {
    selectedQty = Math.max(1, selectedQty + delta);
    const input = document.getElementById('detail-qty-val');
    if (input) input.value = selectedQty;
  }

  /**
   * Add to Cart button on Product Page
   */
  function addToCart() {
    if (!currentProduct || !window.LocalMartCart) return;
    window.LocalMartCart.addItem(currentProduct, selectedQty);
    if (window.LocalMartUI) {
      window.LocalMartUI.showToast(`Added ${selectedQty}x ${currentProduct.name} to Cart! 🛒`, 'success');
    }
  }

  /**
   * Buy Now Button: Add to Cart and Redirect to Checkout
   */
  function buyNow() {
    if (!currentProduct || !window.LocalMartCart) return;
    window.LocalMartCart.addItem(currentProduct, selectedQty);
    window.location.href = 'checkout.html';
  }

  function renderNotFoundState() {
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = `
        <div class="empty-catalog-state" style="max-width: 600px; margin: 4rem auto;">
          <div class="empty-icon">🔍</div>
          <h2>Product Not Found</h2>
          <p>The product you are looking for does not exist or has been removed from our local catalog.</p>
          <a href="shop.html" class="btn btn-primary">Browse All Groceries</a>
        </div>
      `;
    }
  }

  return {
    init,
    setGalleryArt,
    changeQty,
    addToCart,
    buyNow,
    updateBundleTotal,
    addBundleToCart
  };
})();

window.BigBasketProductDetail = BigBasketProductDetail;

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('product-title-display')) {
    BigBasketProductDetail.init();
  }
});
