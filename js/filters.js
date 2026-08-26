/**
 * ==============================================================================
 * BIG BASKET - CATALOG FILTERS CONTROLLER
 * ==============================================================================
 */

const BigBasketFilters = (function () {
  let filterState = {
    category: 'all',
    subcategory: 'all',
    brands: [],
    minPrice: 0,
    maxPrice: 5000,
    rating: 0,
    discount: 0,
    availability: 'all',
    inStockOnly: false,
    search: ''
  };

  let onFilterChange = null;

  function init(initialState = {}, callback = null) {
    filterState = { ...filterState, ...initialState };
    if (filterState.availability === 'in_stock') {
      filterState.inStockOnly = true;
    }
    onFilterChange = callback;
    bindDOMEvents();
    syncDOMInputs();
  }

  function getState() {
    return { ...filterState };
  }

  function setCategory(catId) {
    filterState.category = catId || 'all';
    filterState.subcategory = 'all'; // reset subcategory when category switches
    triggerChange();
  }

  function setSubcategory(subcatName) {
    filterState.subcategory = subcatName || 'all';
    triggerChange();
  }

  function toggleBrand(brandName) {
    const idx = filterState.brands.indexOf(brandName);
    if (idx > -1) {
      filterState.brands.splice(idx, 1);
    } else {
      filterState.brands.push(brandName);
    }
    triggerChange();
  }

  function setPriceRange(min, max) {
    filterState.minPrice = Number(min) || 0;
    filterState.maxPrice = Number(max) || 5000;
    triggerChange();
  }

  function setRating(ratingValue) {
    filterState.rating = Number(ratingValue) || 0;
    triggerChange();
  }

  function setDiscount(discountValue) {
    filterState.discount = Number(discountValue) || 0;
    triggerChange();
  }

  function setAvailability(avail) {
    filterState.availability = avail || 'all';
    filterState.inStockOnly = avail === 'in_stock';
    triggerChange();
  }

  function setSearch(query) {
    filterState.search = query || '';
    triggerChange();
  }

  function reset() {
    filterState = {
      category: 'all',
      subcategory: 'all',
      brands: [],
      minPrice: 0,
      maxPrice: 5000,
      rating: 0,
      discount: 0,
      availability: 'all',
      inStockOnly: false,
      search: ''
    };
    syncDOMInputs();
    triggerChange();
  }

  function triggerChange() {
    if (typeof onFilterChange === 'function') {
      onFilterChange(getState());
    }
    renderActiveFilterChips();
  }

  function bindDOMEvents() {
    // Price quick presets
    document.querySelectorAll('.price-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.price-quick-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const min = btn.dataset.min || 0;
        const max = btn.dataset.max || 5000;
        const minInput = document.getElementById('filter-min-price');
        const maxInput = document.getElementById('filter-max-price');
        if (minInput) minInput.value = min;
        if (maxInput) maxInput.value = max;
        setPriceRange(min, max);
      });
    });

    // Custom price apply
    const priceApplyBtn = document.getElementById('btn-apply-price');
    if (priceApplyBtn) {
      priceApplyBtn.addEventListener('click', () => {
        const minInput = document.getElementById('filter-min-price');
        const maxInput = document.getElementById('filter-max-price');
        const min = minInput ? Number(minInput.value) || 0 : 0;
        const max = maxInput ? Number(maxInput.value) || 5000 : 5000;
        setPriceRange(min, max);
      });
    }

    // Rating radio/buttons
    document.querySelectorAll('input[name="filter-rating"]').forEach(radio => {
      radio.addEventListener('change', () => {
        setRating(radio.value);
      });
    });

    // Discount radio/buttons
    document.querySelectorAll('input[name="filter-discount"]').forEach(radio => {
      radio.addEventListener('change', () => {
        setDiscount(radio.value);
      });
    });

    // Availability radio
    document.querySelectorAll('input[name="filter-availability"]').forEach(radio => {
      radio.addEventListener('change', () => {
        setAvailability(radio.value);
      });
    });

    // Reset buttons
    document.querySelectorAll('.btn-reset-filters').forEach(btn => {
      btn.addEventListener('click', reset);
    });
  }

  function syncDOMInputs() {
    // Uncheck brands
    document.querySelectorAll('.brand-filter-checkbox').forEach(cb => {
      cb.checked = filterState.brands.includes(cb.value);
    });

    // Reset price inputs
    const minInput = document.getElementById('filter-min-price');
    const maxInput = document.getElementById('filter-max-price');
    if (minInput) minInput.value = filterState.minPrice || '';
    if (maxInput) maxInput.value = filterState.maxPrice !== 5000 ? filterState.maxPrice : '';

    // Reset rating radio
    document.querySelectorAll('input[name="filter-rating"]').forEach(radio => {
      radio.checked = Number(radio.value) === filterState.rating;
    });

    // Reset discount radio
    document.querySelectorAll('input[name="filter-discount"]').forEach(radio => {
      radio.checked = Number(radio.value) === filterState.discount;
    });

    // Reset availability radio
    document.querySelectorAll('input[name="filter-availability"]').forEach(radio => {
      radio.checked = radio.value === filterState.availability;
    });
  }

  /**
   * Render Category sidebar list
   */
  function renderCategoryList(categories, activeCatId) {
    const containers = [document.getElementById('filter-category-list'), document.getElementById('mobile-filter-category-list')];

    containers.forEach(container => {
      if (!container) return;

      let html = `
        <li class="filter-cat-item ${!activeCatId || activeCatId === 'all' ? 'active' : ''}">
          <button type="button" class="filter-cat-btn" onclick="BigBasketShop.selectCategory('all')">
            <span>🛒 All Categories</span>
          </button>
        </li>
      `;

      html += categories.map(cat => `
        <li class="filter-cat-item ${activeCatId === cat.slug || String(activeCatId) === String(cat.id) ? 'active' : ''}">
          <button type="button" class="filter-cat-btn" onclick="BigBasketShop.selectCategory('${cat.slug || cat.id}')">
            <span>${cat.icon || '🏷️'} ${cat.name}</span>
          </button>
        </li>
      `).join('');

      container.innerHTML = html;
    });
  }

  /**
   * Render Subcategory lists (sidebar and top bar chips)
   */
  function renderSubcategoryList(subcategories, activeSubcat) {
    const sidebarGroup = document.getElementById('filter-subcategory-group');
    const mobileSidebarGroup = document.getElementById('mobile-filter-subcategory-group');
    const topBar = document.getElementById('subcategory-chips-bar');

    if (!subcategories || subcategories.length === 0) {
      if (sidebarGroup) sidebarGroup.style.display = 'none';
      if (mobileSidebarGroup) mobileSidebarGroup.style.display = 'none';
      if (topBar) topBar.style.display = 'none';
      return;
    }

    if (sidebarGroup) sidebarGroup.style.display = 'block';
    if (mobileSidebarGroup) mobileSidebarGroup.style.display = 'block';

    const sidebarContainers = [document.getElementById('filter-subcategory-list'), document.getElementById('mobile-filter-subcategory-list')];
    sidebarContainers.forEach(container => {
      if (!container) return;
      let html = `
        <li class="filter-cat-item ${!activeSubcat || activeSubcat === 'all' ? 'active' : ''}">
          <button type="button" class="filter-cat-btn" onclick="BigBasketShop.selectSubcategory('all')">
            <span>All Subcategories</span>
          </button>
        </li>
      `;
      html += subcategories.map(sub => `
        <li class="filter-cat-item ${activeSubcat === sub ? 'active' : ''}">
          <button type="button" class="filter-cat-btn" onclick="BigBasketShop.selectSubcategory('${sub.replace(/'/g, "\\'")}')">
            <span>${sub}</span>
          </button>
        </li>
      `).join('');
      container.innerHTML = html;
    });

    if (topBar) {
      topBar.style.display = 'flex';
      let chipsHtml = `
        <button type="button" class="subcat-chip ${!activeSubcat || activeSubcat === 'all' ? 'active' : ''}" onclick="BigBasketShop.selectSubcategory('all')">
          All
        </button>
      `;
      chipsHtml += subcategories.map(sub => `
        <button type="button" class="subcat-chip ${activeSubcat === sub ? 'active' : ''}" onclick="BigBasketShop.selectSubcategory('${sub.replace(/'/g, "\\'")}')">
          ${sub}
        </button>
      `).join('');
      topBar.innerHTML = chipsHtml;
    }
  }

  /**
   * Render dynamic Brand list based on available products
   */
  function renderBrandList(brands, selectedBrands = []) {
    const containers = [document.getElementById('filter-brand-list'), document.getElementById('mobile-filter-brand-list')];

    containers.forEach(container => {
      if (!container) return;

      if (!brands || brands.length === 0) {
        container.innerHTML = `<li class="text-muted" style="font-size: 0.8rem; padding: 4px 0;">No brands available</li>`;
        return;
      }

      container.innerHTML = brands.map(b => {
        const isChecked = selectedBrands.includes(b);
        const safeId = `brand-${b.replace(/[^a-zA-Z0-9]/g, '_')}`;
        return `
          <li class="filter-checkbox-item">
            <label for="${safeId}" class="filter-checkbox-label">
              <input type="checkbox" id="${safeId}" class="brand-filter-checkbox" value="${b}" ${isChecked ? 'checked' : ''} onchange="BigBasketFilters.toggleBrand('${b.replace(/'/g, "\\'")}')">
              <span>${b}</span>
            </label>
          </li>
        `;
      }).join('');
    });
  }

  /**
   * Render active filter tags strip
   */
  function renderActiveFilterChips() {
    const container = document.getElementById('active-filters-chips');
    if (!container) return;

    const chips = [];

    if (filterState.category && filterState.category !== 'all') {
      chips.push({
        label: `Category: ${filterState.category.replace(/-/g, ' ')}`,
        onRemove: () => BigBasketShop.selectCategory('all')
      });
    }

    if (filterState.subcategory && filterState.subcategory !== 'all') {
      chips.push({
        label: `Subcategory: ${filterState.subcategory}`,
        onRemove: () => BigBasketShop.selectSubcategory('all')
      });
    }

    filterState.brands.forEach(b => {
      chips.push({
        label: `Brand: ${b}`,
        onRemove: () => toggleBrand(b)
      });
    });

    if (filterState.minPrice > 0 || filterState.maxPrice < 5000) {
      chips.push({
        label: `Price: ₹${filterState.minPrice} - ₹${filterState.maxPrice}`,
        onRemove: () => setPriceRange(0, 5000)
      });
    }

    if (filterState.rating > 0) {
      chips.push({
        label: `Rating: ${filterState.rating}★ & above`,
        onRemove: () => setRating(0)
      });
    }

    if (filterState.discount > 0) {
      chips.push({
        label: `Discount: ${filterState.discount}%+ OFF`,
        onRemove: () => setDiscount(0)
      });
    }

    if (filterState.availability === 'in_stock') {
      chips.push({
        label: `In Stock Only`,
        onRemove: () => setAvailability('all')
      });
    } else if (filterState.availability === 'out_of_stock') {
      chips.push({
        label: `Out of Stock`,
        onRemove: () => setAvailability('all')
      });
    }

    if (filterState.search) {
      chips.push({
        label: `Search: "${filterState.search}"`,
        onRemove: () => setSearch('')
      });
    }

    if (chips.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML = `
      <div class="active-chips-list">
        ${chips.map((chip, i) => `
          <span class="active-chip">
            ${chip.label}
            <button type="button" class="chip-remove-btn" onclick="BigBasketFilters.removeChip(${i})" aria-label="Remove filter">✕</button>
          </span>
        `).join('')}
        <button type="button" class="btn-clear-all-chips" onclick="BigBasketFilters.reset()">Clear All</button>
      </div>
    `;

    window._activeFilterChips = chips;
  }

  function removeChip(index) {
    if (window._activeFilterChips && window._activeFilterChips[index]) {
      window._activeFilterChips[index].onRemove();
    }
  }

  return {
    init,
    getState,
    setCategory,
    setSubcategory,
    toggleBrand,
    setPriceRange,
    setRating,
    setDiscount,
    setAvailability,
    setSearch,
    reset,
    renderCategoryList,
    renderSubcategoryList,
    renderBrandList,
    renderActiveFilterChips,
    removeChip
  };
})();

window.BigBasketFilters = BigBasketFilters;

