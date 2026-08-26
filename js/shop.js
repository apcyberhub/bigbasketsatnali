/**
 * ==============================================================================
 * BIG BASKET - SHOP CATALOG PAGE CONTROLLER
 * ==============================================================================
 */

const BigBasketShop = (function () {
  let currentPage = 1;
  const PAGE_SIZE = 24;
  let totalProducts = 0;
  let totalPages = 1;
  let categoriesCache = [];
  let currentCategorySubcategories = [];

  /**
   * Parse query parameters from window.location.search
   */
  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const brandParam = params.get('brand') || '';
    const brandsList = brandParam ? brandParam.split(',').map(b => b.trim()).filter(Boolean) : [];

    return {
      category: params.get('category') || 'all',
      subcategory: params.get('subcategory') || 'all',
      search: params.get('search') || '',
      brand: brandParam,
      brands: brandsList,
      sort: params.get('sort') || 'relevance',
      minPrice: Number(params.get('min_price') || params.get('minPrice')) || 0,
      maxPrice: Number(params.get('max_price') || params.get('maxPrice')) || 5000,
      rating: Number(params.get('rating')) || 0,
      discount: Number(params.get('discount')) || 0,
      availability: params.get('availability') || (params.get('in_stock') === 'true' ? 'in_stock' : 'all'),
      page: Number(params.get('page')) || 1
    };
  }

  async function init() {
    // 1. Initialize core managers
    if (window.BigBasketWishlist) window.BigBasketWishlist.init();
    if (window.BigBasketRecentlyViewed) window.BigBasketRecentlyViewed.init();
    if (window.LocalMartCart) window.LocalMartCart.init();
    if (window.LocalMartHeader) window.LocalMartHeader.init();
    if (window.LocalMartSearch) window.LocalMartSearch.init();
    if (window.LocalMartLocation) window.LocalMartLocation.init();

    // 2. Load categories from API
    try {
      categoriesCache = await window.LocalMartAPI.getCategories();
    } catch (e) {
      console.error('Error fetching categories:', e);
    }

    // 3. Extract Initial URL state
    const urlState = getUrlParams();
    currentPage = urlState.page || 1;

    // 4. Initialize Filters & Sorting
    BigBasketFilters.init({
      category: urlState.category,
      subcategory: urlState.subcategory,
      brands: urlState.brands,
      search: urlState.search,
      minPrice: urlState.minPrice,
      maxPrice: urlState.maxPrice,
      rating: urlState.rating,
      discount: urlState.discount,
      availability: urlState.availability
    }, () => {
      loadCatalog(true);
    });

    BigBasketSorting.init(urlState.sort, () => {
      loadCatalog(true);
    });

    // 5. Render Category sidebar
    BigBasketFilters.renderCategoryList(categoriesCache, urlState.category);

    // 6. Bind Load More button
    const loadMoreBtn = document.getElementById('btn-load-more');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', loadMore);
    }

    // 7. Listen for Browser Back / Forward button changes
    window.addEventListener('popstate', handlePopState);

    // 8. Initial Catalog Load
    await loadCatalog(false);
  }

  /**
   * Handle browser navigation (Back / Forward)
   */
  async function handlePopState() {
    const urlState = getUrlParams();
    currentPage = urlState.page || 1;

    BigBasketFilters.init({
      category: urlState.category,
      subcategory: urlState.subcategory,
      brands: urlState.brands,
      search: urlState.search,
      minPrice: urlState.minPrice,
      maxPrice: urlState.maxPrice,
      rating: urlState.rating,
      discount: urlState.discount,
      availability: urlState.availability
    });

    BigBasketSorting.setSort(urlState.sort);
    BigBasketFilters.renderCategoryList(categoriesCache, urlState.category);
    await loadCatalog(false, false);
  }

  /**
   * Render loading skeleton cards in the product grid
   */
  function renderLoadingSkeletons(gridContainer) {
    if (!gridContainer) return;
    const skeletonCardHTML = `
      <div class="product-card skeleton-card" style="opacity: 0.7; pointer-events: none;">
        <div style="height: 140px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: skeleton-shimmer 1.5s infinite; border-radius: var(--radius-md); margin-bottom: 0.75rem;"></div>
        <div style="height: 14px; width: 50%; background: #e5e7eb; border-radius: 4px; margin-bottom: 0.5rem;"></div>
        <div style="height: 18px; width: 85%; background: #e5e7eb; border-radius: 4px; margin-bottom: 0.5rem;"></div>
        <div style="height: 14px; width: 40%; background: #e5e7eb; border-radius: 4px; margin-bottom: 0.75rem;"></div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="height: 20px; width: 60px; background: #e5e7eb; border-radius: 4px;"></div>
          <div style="height: 32px; width: 70px; background: #e5e7eb; border-radius: 4px;"></div>
        </div>
      </div>
    `;
    gridContainer.innerHTML = Array(8).fill(skeletonCardHTML).join('');
  }

  /**
   * Load Catalog Products from API based on current filter & sort state
   */
  async function loadCatalog(resetPage = true, pushUrl = true) {
    if (resetPage) {
      currentPage = 1;
    }

    const filterState = BigBasketFilters.getState();
    const currentSort = BigBasketSorting.getSort();

    // Show loading skeleton if resetting page
    const gridContainer = document.getElementById('shop-product-grid');
    if (gridContainer && resetPage) {
      renderLoadingSkeletons(gridContainer);
    }

    try {
      // 1. Fetch products from API
      const response = await window.LocalMartAPI.getProducts({
        category: filterState.category,
        subcategory: filterState.subcategory,
        brands: filterState.brands,
        search: filterState.search,
        minPrice: filterState.minPrice,
        maxPrice: filterState.maxPrice,
        rating: filterState.rating,
        discount: filterState.discount,
        availability: filterState.availability,
        sort: currentSort,
        page: currentPage,
        limit: PAGE_SIZE
      });

      totalProducts = response.totalCount;
      totalPages = response.totalPages || Math.ceil(totalProducts / PAGE_SIZE) || 1;

      // 2. Render Products
      if (window.LocalMartProducts) {
        window.LocalMartProducts.renderProductGrid('shop-product-grid', response.products, !resetPage);
      }

      // 3. Extract subcategories dynamically from products or category metadata
      extractAndRenderSubcategories(response.products, filterState.category, filterState.subcategory);

      // 4. Update Available Brands Filter List
      const availableBrands = await window.LocalMartAPI.getBrands(filterState.category !== 'all' ? filterState.category : null);
      BigBasketFilters.renderBrandList(availableBrands, filterState.brands);

      // 5. Update Header, Breadcrumb, and Count
      updatePageHeader(filterState.category, response.totalCount, filterState.search, filterState.subcategory);

      // 6. Update Pagination & Load More Controls
      updatePaginationControls(response);

      // 7. Update URL without reloading page
      if (pushUrl) {
        updateUrlParams(filterState, currentSort, currentPage);
      }
    } catch (e) {
      console.error('Error loading products:', e);
      if (gridContainer && resetPage) {
        gridContainer.innerHTML = `
          <div class="empty-catalog-state" style="grid-column: 1 / -1;">
            <div class="empty-icon">⚠️</div>
            <h3>Unable to load products</h3>
            <p>Please check your connection and try again.</p>
            <button type="button" class="btn btn-primary btn-sm" onclick="BigBasketShop.loadCatalog(true)">Try Again</button>
          </div>
        `;
      }
    }
  }

  /**
   * Extract and display subcategories chips
   */
  function extractAndRenderSubcategories(products, activeCat, activeSubcat) {
    if (!activeCat || activeCat === 'all') {
      BigBasketFilters.renderSubcategoryList([], 'all');
      return;
    }

    // Default category subcategory presets
    const subcategoryMap = {
      'fruits-vegetables': ['Fresh Fruits', 'Fresh Vegetables', 'Exotic & Organic', 'Herbs & Seasoning'],
      'atta-rice-dal': ['Atta & Flours', 'Basmati & Rice', 'Dals & Pulses', 'Grains'],
      'dairy-breakfast': ['Milk', 'Butter & Spreads', 'Cheese', 'Curd & Paneer', 'Eggs', 'Breads'],
      'bakery': ['Breads & Buns', 'Cakes & Pastries', 'Cookies & Rusks', 'Puffs & Patties'],
      'biscuits': ['Cream Biscuits', 'Cookies', 'Digestive & Health', 'Wafers'],
      'snacks': ['Chips & Crisps', 'Namkeen & Bhujia', 'Popcorn', 'Roasted Snacks'],
      'chocolates': ['Chocolates', 'Candies & Toffees', 'Indian Sweets', 'Gift Boxes'],
      'beverages': ['Tea', 'Coffee', 'Juices & Nectars', 'Soft Drinks', 'Energy Drinks'],
      'instant-food': ['Noodles & Pasta', 'Instant Mixes', 'Ready to Eat', 'Cereals'],
      'oil-ghee': ['Mustard Oil', 'Sunflower Oil', 'Desi Ghee', 'Olive Oil'],
      'personal-care': ['Soaps & Body Wash', 'Shampoos & Hair Care', 'Dental Care', 'Skin Creams'],
      'cleaning': ['Detergents & Bars', 'Floor Cleaners', 'Dishwash Liquids', 'Toilet Cleaners'],
      'household': ['Kitchen Essentials', 'Pooja Needs', 'Tissues & Wipes', 'Air Fresheners'],
      'baby-care': ['Diapers & Wipes', 'Baby Food', 'Baby Skin Care', 'Bath & Hygiene'],
      'toys-games': ['Educational Toys', 'Soft Toys', 'Board Games', 'Outdoor & Sports']
    };

    let subcategories = subcategoryMap[activeCat] || [];
    if (products && products.length > 0) {
      const fromProds = products.map(p => p.subcategory || p.subcategory_name).filter(Boolean);
      subcategories = Array.from(new Set([...subcategories, ...fromProds]));
    }

    currentCategorySubcategories = subcategories;
    BigBasketFilters.renderSubcategoryList(subcategories, activeSubcat);
  }

  /**
   * Load Next Page (Infinite Scroll / Load More)
   */
  async function loadMore() {
    const loadMoreBtn = document.getElementById('btn-load-more');
    if (loadMoreBtn) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'Loading more...';
    }

    currentPage++;
    await loadCatalog(false, true);

    if (loadMoreBtn) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Load More Products';
    }
  }

  /**
   * Jump directly to a specific page
   */
  async function goToPage(pageNum) {
    if (pageNum < 1 || pageNum > totalPages || pageNum === currentPage) return;
    currentPage = pageNum;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await loadCatalog(false, true);
  }

  /**
   * Select a category directly
   */
  function selectCategory(categoryId) {
    BigBasketFilters.setCategory(categoryId);
    BigBasketFilters.renderCategoryList(categoriesCache, categoryId);
    closeMobileFilters();
  }

  /**
   * Select a subcategory directly
   */
  function selectSubcategory(subcategoryName) {
    BigBasketFilters.setSubcategory(subcategoryName);
    closeMobileFilters();
  }

  /**
   * Update Breadcrumb, Page Title & Product Count
   */
  function updatePageHeader(categoryId, count, searchQuery, subcategory) {
    const titleEl = document.getElementById('shop-page-title');
    const countEl = document.getElementById('shop-product-count');
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');

    let titleText = 'All Groceries & Daily Essentials';
    let breadcrumbText = 'All Products';

    if (searchQuery) {
      titleText = `Search results for "${searchQuery}"`;
      breadcrumbText = `Search: "${searchQuery}"`;
    } else if (categoryId && categoryId !== 'all') {
      const cat = categoriesCache.find(c => c.slug === categoryId || String(c.id) === String(categoryId));
      if (cat) {
        titleText = subcategory && subcategory !== 'all' ? `${cat.name} — ${subcategory}` : `${cat.icon || '🛒'} ${cat.name}`;
        breadcrumbText = cat.name;
      }
    }

    if (titleEl) titleEl.textContent = titleText;
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = breadcrumbText;
    if (countEl) {
      countEl.textContent = count === 1 ? '1 product found' : `${count.toLocaleString()} products found`;
    }
  }

  /**
   * Update pagination progress bar & numeric page buttons
   */
  function updatePaginationControls(pageData) {
    const paginationWrap = document.getElementById('shop-pagination-wrap');
    const loadMoreBtn = document.getElementById('btn-load-more');
    const progressText = document.getElementById('pagination-progress-text');
    const progressBar = document.getElementById('pagination-progress-bar');
    const pagesContainer = document.getElementById('pagination-pages');

    if (!paginationWrap) return;

    const currentlyShown = Math.min(pageData.page * pageData.limit, pageData.totalCount);

    if (pageData.totalCount <= PAGE_SIZE || currentlyShown >= pageData.totalCount) {
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    } else {
      if (loadMoreBtn) loadMoreBtn.style.display = 'inline-flex';
    }

    if (progressText) {
      progressText.textContent = `Showing ${pageData.products.length > 0 ? (pageData.page - 1) * pageData.limit + 1 : 0}–${currentlyShown} of ${pageData.totalCount} products`;
    }

    if (progressBar) {
      const pct = pageData.totalCount > 0 ? (currentlyShown / pageData.totalCount) * 100 : 100;
      progressBar.style.width = `${pct}%`;
    }

    // Render numeric page buttons if totalPages > 1
    if (pagesContainer) {
      if (totalPages <= 1) {
        pagesContainer.innerHTML = '';
      } else {
        let pagesHTML = `
          <button type="button" class="page-nav-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="BigBasketShop.goToPage(${currentPage - 1})" aria-label="Previous page">
            ← Prev
          </button>
        `;

        for (let p = 1; p <= totalPages; p++) {
          if (p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)) {
            pagesHTML += `
              <button type="button" class="page-number-btn ${p === currentPage ? 'active' : ''}" onclick="BigBasketShop.goToPage(${p})">
                ${p}
              </button>
            `;
          } else if (p === currentPage - 3 || p === currentPage + 3) {
            pagesHTML += `<span style="padding: 0 4px; color: var(--color-text-muted);">...</span>`;
          }
        }

        pagesHTML += `
          <button type="button" class="page-nav-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="BigBasketShop.goToPage(${currentPage + 1})" aria-label="Next page">
            Next →
          </button>
        `;

        pagesContainer.innerHTML = pagesHTML;
      }
    }
  }

  /**
   * Update browser history URL params silently
   */
  function updateUrlParams(filterState, sort, page) {
    const params = new URLSearchParams();
    if (filterState.category && filterState.category !== 'all') params.set('category', filterState.category);
    if (filterState.subcategory && filterState.subcategory !== 'all') params.set('subcategory', filterState.subcategory);
    if (filterState.search) params.set('search', filterState.search);
    if (filterState.brands && filterState.brands.length > 0) params.set('brand', filterState.brands.join(','));
    if (filterState.minPrice > 0) params.set('min_price', filterState.minPrice);
    if (filterState.maxPrice < 5000) params.set('max_price', filterState.maxPrice);
    if (filterState.rating > 0) params.set('rating', filterState.rating);
    if (filterState.discount > 0) params.set('discount', filterState.discount);
    if (filterState.availability && filterState.availability !== 'all') params.set('availability', filterState.availability);
    if (sort && sort !== 'relevance') params.set('sort', sort);
    if (page && page > 1) params.set('page', page);

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({ ...filterState, sort, page }, '', newUrl);
  }

  /**
   * Mobile Filter Drawer controls
   */
  function openMobileFilters() {
    const drawer = document.getElementById('mobile-filter-drawer');
    if (drawer) {
      drawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileFilters() {
    const drawer = document.getElementById('mobile-filter-drawer');
    if (drawer) {
      drawer.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function applyMobileFilters() {
    closeMobileFilters();
    loadCatalog(true);
  }

  function resetFilters() {
    BigBasketFilters.reset();
  }

  return {
    init,
    loadCatalog,
    loadMore,
    goToPage,
    selectCategory,
    selectSubcategory,
    openMobileFilters,
    closeMobileFilters,
    applyMobileFilters,
    resetFilters
  };
})();

window.BigBasketShop = BigBasketShop;

// Initialize on DOM ready if on shop page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('shop-product-grid')) {
    BigBasketShop.init();
  }
});

