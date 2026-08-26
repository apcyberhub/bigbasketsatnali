/**
 * ==============================================================================
 * BIG BASKET - RECENTLY VIEWED TRACKER (Client-Side State)
 * ==============================================================================
 */

const BigBasketRecentlyViewed = (function () {
  const STORAGE_KEY = 'bigbasket_recent_viewed_v1';
  const MAX_ITEMS = 10;
  let items = [];

  function load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      items = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(items)) items = [];
    } catch (e) {
      console.warn('Error loading recently viewed:', e);
      items = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Error saving recently viewed:', e);
    }
  }

  return {
    init() {
      load();
    },

    add(productId) {
      if (!productId) return;
      load();
      // Remove if already in list, then prepend
      items = items.filter(id => id !== productId);
      items.unshift(productId);
      if (items.length > MAX_ITEMS) {
        items = items.slice(0, MAX_ITEMS);
      }
      save();
    },

    getIds() {
      load();
      return [...items];
    },

    async getProducts(excludeId = null) {
      load();
      let targetIds = excludeId ? items.filter(id => id !== excludeId) : items;
      if (!window.LocalMartAPI || targetIds.length === 0) return [];

      const promises = targetIds.map(id => window.LocalMartAPI.getProduct(id).catch(() => null));
      const results = await Promise.all(promises);
      return results.filter(Boolean);
    },

    clear() {
      items = [];
      save();
    }
  };
})();

// Export globally
window.BigBasketRecentlyViewed = BigBasketRecentlyViewed;
window.LocalMartRecentlyViewed = BigBasketRecentlyViewed;
