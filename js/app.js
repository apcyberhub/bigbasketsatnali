/**
 * ==============================================================================
 * BIG BASKET - MAIN APPLICATION ENTRYPOINT
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Initializing Big Basket E-Commerce Platform [Step 1]');

  // Initialize Core Subsystems
  if (window.BigBasketWishlist) BigBasketWishlist.init();
  if (window.BigBasketRecentlyViewed) BigBasketRecentlyViewed.init();
  if (window.LocalMartCart) LocalMartCart.init();
  if (window.LocalMartLocation) LocalMartLocation.init();
  if (window.LocalMartSearch) LocalMartSearch.init();
  if (window.LocalMartHeader) LocalMartHeader.init();

  // Load Homepage Data
  if (window.LocalMartAPI && window.LocalMartProducts) {
    try {
      // 1. Render Categories
      const categories = await window.LocalMartAPI.getCategories();
      renderCategoryGrid(categories);

      // 2. Render Product Sections
      const sections = await window.LocalMartAPI.getFeaturedSections();

      LocalMartProducts.renderProductList('best-sellers-carousel', sections.bestSellers);
      LocalMartProducts.renderProductList('fresh-grocery-carousel', sections.freshGrocery);
      LocalMartProducts.renderProductList('snacks-carousel', sections.snacksChocolates);
      LocalMartProducts.renderProductList('toys-carousel', sections.toysKids);
      LocalMartProducts.renderProductList('household-carousel', sections.householdEssentials);

      // Setup Carousel Arrow Controls for each section
      document.querySelectorAll('.product-section').forEach(sec => {
        LocalMartProducts.setupCarouselControls(sec);
      });

    } catch (err) {
      console.error('Error loading homepage catalog data:', err);
    }
  }

  // Setup Newsletter Form
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]');
      if (input && input.value) {
        if (window.LocalMartUI) {
          window.LocalMartUI.showToast(`Thank you! You're subscribed to Big Basket VIP discounts.`, 'success');
        }
        input.value = '';
      }
    });
  }
});

/**
 * Render the 14 Category Cards Grid
 */
function renderCategoryGrid(categories) {
  const container = document.getElementById('category-grid-container');
  if (!container) return;

  container.innerHTML = categories.map(cat => `
    <a href="shop.html?category=${cat.id}" class="category-card" aria-label="${cat.name}">
      <div class="category-icon-wrap ${cat.colorClass}">
        ${cat.icon}
      </div>
      <div class="category-name">${cat.name}</div>
      <div class="category-discount-hint">${cat.discount}</div>
    </a>
  `).join('');
}
