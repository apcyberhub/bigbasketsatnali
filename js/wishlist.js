/**
 * ==============================================================================
 * BIG BASKET - WISHLIST MANAGER (Client-Side State)
 * ==============================================================================
 */

const BigBasketWishlist = (function () {
  const STORAGE_KEY = 'bigbasket_wishlist_v1';
  let wishlist = [];

  function load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      wishlist = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(wishlist)) wishlist = [];
    } catch (e) {
      console.warn('Error loading wishlist from storage:', e);
      wishlist = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Error saving wishlist to storage:', e);
    }
    updateBadge();
  }

  function updateBadge() {
    const count = wishlist.length;
    document.querySelectorAll('.wishlist-badge-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  }

  return {
    init() {
      load();
      updateBadge();
    },

    has(productId) {
      return wishlist.includes(productId);
    },

    getAll() {
      return [...wishlist];
    },

    getCount() {
      return wishlist.length;
    },

    toggle(productId, productName = 'Item') {
      const index = wishlist.indexOf(productId);
      let isAdded = false;

      if (index > -1) {
        wishlist.splice(index, 1);
        isAdded = false;
        if (window.LocalMartUI) {
          LocalMartUI.showToast(`Removed from Wishlist`, 'info');
        }
      } else {
        wishlist.push(productId);
        isAdded = true;
        if (window.LocalMartUI) {
          LocalMartUI.showToast(`Added ${productName} to Wishlist! ❤️`, 'success');
        }
      }

      save();

      // Update all heart icons for this product ID on the page
      document.querySelectorAll(`[data-wishlist-id="${productId}"]`).forEach(btn => {
        if (isAdded) {
          btn.classList.add('active');
          btn.setAttribute('aria-label', 'Remove from Wishlist');
          btn.innerHTML = '❤️';
        } else {
          btn.classList.remove('active');
          btn.setAttribute('aria-label', 'Add to Wishlist');
          btn.innerHTML = '🤍';
        }
      });

      return isAdded;
    }
  };
})();

// Export globally
window.BigBasketWishlist = BigBasketWishlist;
window.LocalMartWishlist = BigBasketWishlist;
