/**
 * ==============================================================================
 * BIG BASKET - ADVANCED MULTI-FIELD SEARCH & SUGGESTIONS CONTROLLER
 * ==============================================================================
 */

const LocalMartSearch = (function () {
  const RECENT_KEY = 'bigbasket_recent_searches_v1';
  const POPULAR_SEARCHES = ['Milk', 'Atta 5kg', 'Amul Butter', 'Oreo', 'Cadbury Silk', 'Maggi', 'Tomatoes', 'Oil & Ghee', 'Surf Excel'];

  let recentSearches = ['Amul Milk', 'Fortune Oil', 'Chocolates', 'Pampers'];

  function loadRecents() {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) {
        recentSearches = JSON.parse(saved);
        if (!Array.isArray(recentSearches)) recentSearches = [];
      }
    } catch (e) {
      console.warn('Error loading recent searches', e);
    }
  }

  function saveRecent(query) {
    if (!query || query.trim() === '') return;
    const clean = query.trim();
    recentSearches = [clean, ...recentSearches.filter(q => q.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recentSearches));
    } catch (e) {
      console.warn('Error saving recent searches', e);
    }
  }

  function clearRecents() {
    recentSearches = [];
    localStorage.removeItem(RECENT_KEY);
    renderDropdowns('');
  }

  function performSearch(query) {
    if (!query || query.trim() === '') return;
    saveRecent(query);
    window.location.href = `shop.html?search=${encodeURIComponent(query.trim())}`;
  }

  function renderSearchingState(dropdown, query) {
    dropdown.innerHTML = `
      <div style="padding: 1.25rem 1rem; text-align: center; color: var(--color-text-secondary);">
        <div style="display: inline-block; width: 24px; height: 24px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 0.5rem;"></div>
        <div style="font-size: 0.82rem; font-weight: 600;">Searching for "${query}"...</div>
      </div>
    `;
    dropdown.style.display = 'block';
  }

  async function renderDropdowns(query = '') {
    const dropdowns = document.querySelectorAll('.search-dropdown, #search-dropdown-menu');
    
    for (const dropdown of dropdowns) {
      if (!query || query.trim().length === 0) {
        // Render Recent & Popular Searches
        let recentsHTML = '';
        if (recentSearches.length > 0) {
          recentsHTML = `
            <div class="search-dropdown-section" style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-border-subtle);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-secondary);">🕒 Recent Searches</span>
                <button type="button" style="background: none; border: none; font-size: 0.75rem; color: var(--color-primary); cursor: pointer; font-weight: 600;" onclick="LocalMartSearch.clearRecents()">Clear All</button>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                ${recentSearches.map(term => `
                  <button type="button" class="popular-tag" onclick="LocalMartSearch.performSearch('${term.replace(/'/g, "\\'")}')" style="background: var(--color-background-alt); border: 1px solid var(--color-border); border-radius: var(--radius-pill); padding: 0.25rem 0.6rem; font-size: 0.8rem; cursor: pointer;">
                    ${term}
                  </button>
                `).join('')}
              </div>
            </div>
          `;
        }

        const popularHTML = `
          <div class="search-dropdown-section" style="padding: 0.75rem 1rem;">
            <div style="margin-bottom: 0.5rem;">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-secondary);">🔥 Trending Searches</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
              ${POPULAR_SEARCHES.map(term => `
                <button type="button" class="popular-tag" onclick="LocalMartSearch.performSearch('${term.replace(/'/g, "\\'")}')" style="background: var(--color-background-alt); border: 1px solid var(--color-border); border-radius: var(--radius-pill); padding: 0.25rem 0.6rem; font-size: 0.8rem; cursor: pointer;">
                  ${term}
                </button>
              `).join('')}
            </div>
          </div>
        `;

        dropdown.innerHTML = recentsHTML + popularHTML;
        dropdown.style.display = 'block';
      } else {
        // Query search suggestions API with products, categories, and brands
        if (window.LocalMartAPI && typeof window.LocalMartAPI.getSearchSuggestions === 'function') {
          const suggestions = await window.LocalMartAPI.getSearchSuggestions(query);
          const products = suggestions.products || [];
          const categories = suggestions.categories || [];
          const brands = suggestions.brands || [];

          if (products.length === 0 && categories.length === 0 && brands.length === 0) {
            dropdown.innerHTML = `
              <div style="padding: 1.5rem; text-align: center; color: var(--color-text-secondary); font-size: 0.85rem;">
                No matching products for "<strong>${query}</strong>".<br>
                <span style="font-size: 0.75rem; color: var(--color-text-muted);">Try searching for milk, atta, oil, biscuits, or chips.</span>
              </div>
            `;
          } else {
            let catHTML = '';
            if (categories.length > 0) {
              catHTML = `
                <div style="padding: 0.5rem 1rem 0.4rem; border-bottom: 1px solid var(--color-border-subtle);">
                  <span style="font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;">Categories</span>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.35rem;">
                    ${categories.map(c => `
                      <a href="shop.html?search=${encodeURIComponent(c)}" style="display: inline-block; background: #fff5f5; color: var(--color-primary); border: 1px solid #ffd4d6; border-radius: 999px; padding: 0.2rem 0.6rem; font-size: 0.78rem; font-weight: 600; text-decoration: none;">
                        ${c}
                      </a>
                    `).join('')}
                  </div>
                </div>
              `;
            }

            let brandHTML = '';
            if (brands.length > 0) {
              brandHTML = `
                <div style="padding: 0.4rem 1rem; border-bottom: 1px solid var(--color-border-subtle);">
                  <span style="font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;">Brands</span>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.35rem;">
                    ${brands.map(b => `
                      <a href="shop.html?brand=${encodeURIComponent(b)}" style="display: inline-block; background: var(--color-background-alt); color: var(--color-text-primary); border: 1px solid var(--color-border); border-radius: 999px; padding: 0.2rem 0.6rem; font-size: 0.78rem; font-weight: 600; text-decoration: none;">
                        ${b}
                      </a>
                    `).join('')}
                  </div>
                </div>
              `;
            }

            let prodHTML = '';
            if (products.length > 0) {
              prodHTML = `
                <div class="search-dropdown-section" style="padding: 0.3rem 0;">
                  <div style="padding: 0.35rem 1rem; font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;">
                    Matching Products (${products.length})
                  </div>
                  <div>
                    ${products.slice(0, 5).map(prod => `
                      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.55rem 1rem; cursor: pointer; border-bottom: 1px solid var(--color-border-subtle); transition: background 0.15s;" onmouseover="this.style.background='var(--color-background-alt)'" onmouseout="this.style.background='transparent'" onclick="window.location.href='product.html?id=${prod.id}'">
                        <div style="display: flex; align-items: center; gap: 0.75rem; min-width: 0;">
                          ${prod.image_url ? `<img src="${prod.image_url}" alt="${prod.name}" style="width: 32px; height: 32px; object-fit: contain; border-radius: 4px;" onerror="this.outerHTML='<span style=\\'font-size: 1.3rem;\\'>${prod.emoji || '📦'}</span>';">` : `<span style="font-size: 1.3rem;">${prod.emoji || '📦'}</span>`}
                          <div style="min-width: 0;">
                            <div style="font-size: 0.82rem; font-weight: 700; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${prod.name}</div>
                            <div style="font-size: 0.72rem; color: var(--color-text-muted);">${prod.brand} ${prod.weight ? '• ' + prod.weight : ''}</div>
                          </div>
                        </div>
                        <div style="text-align: right; margin-left: 0.5rem; flex-shrink: 0;">
                          <div style="font-weight: 800; color: var(--color-primary); font-size: 0.88rem;">₹${prod.selling_price || prod.sellingPrice}</div>
                          ${(prod.mrp && Number(prod.mrp) > Number(prod.selling_price || prod.sellingPrice)) ? `<div style="font-size: 0.7rem; color: var(--color-text-muted); text-decoration: line-through;">₹${prod.mrp}</div>` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }

            const footerCTA = `
              <div style="padding: 0.6rem; background: var(--color-background-alt); text-align: center; border-top: 1px solid var(--color-border);">
                <a href="shop.html?search=${encodeURIComponent(query)}" style="font-size: 0.82rem; font-weight: 700; color: var(--color-primary); text-decoration: none;">
                  View all matching results for "${query}" →
                </a>
              </div>
            `;

            dropdown.innerHTML = catHTML + brandHTML + prodHTML + footerCTA;
          }
          dropdown.style.display = 'block';
        }
      }
    }
  }

  function setupSearchForm(inputEl, dropdownEl, clearBtn, formEl) {
    if (!inputEl) return;

    let debounceTimer = null;

    inputEl.addEventListener('focus', () => {
      renderDropdowns(inputEl.value);
      if (dropdownEl) dropdownEl.style.display = 'block';
    });

    inputEl.addEventListener('input', () => {
      const val = inputEl.value;
      if (clearBtn) {
        clearBtn.style.display = val.length > 0 ? 'inline-flex' : 'none';
      }

      if (val.trim().length > 0 && dropdownEl) {
        renderSearchingState(dropdownEl, val.trim());
      }

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderDropdowns(val);
      }, 250);
    });

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch(inputEl.value);
      } else if (e.key === 'Escape') {
        if (dropdownEl) dropdownEl.style.display = 'none';
        inputEl.blur();
      }
    });

    if (formEl) {
      formEl.addEventListener('submit', (e) => {
        e.preventDefault();
        performSearch(inputEl.value);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        inputEl.value = '';
        clearBtn.style.display = 'none';
        renderDropdowns('');
        inputEl.focus();
      });
    }
  }

  function init() {
    loadRecents();

    // 1. Primary Header Search Form
    const mainInput = document.getElementById('header-search-input');
    const mainDropdown = document.getElementById('search-dropdown-menu');
    const mainClear = document.getElementById('search-clear-btn');
    const mainForm = document.getElementById('header-search-form');
    setupSearchForm(mainInput, mainDropdown, mainClear, mainForm);

    // 2. Desktop Search Elements
    const deskInput = document.getElementById('search-input-desktop');
    const deskDropdown = document.getElementById('search-dropdown-desktop');
    const deskClear = document.getElementById('search-clear-desktop');
    const deskForm = document.getElementById('search-form-desktop');
    setupSearchForm(deskInput, deskDropdown, deskClear, deskForm);

    // 3. Mobile Search Elements
    const mobInput = document.getElementById('search-input-mobile');
    const mobDropdown = document.getElementById('search-dropdown-mobile');
    const mobClear = document.getElementById('search-clear-mobile');
    const mobForm = document.getElementById('search-form-mobile');
    setupSearchForm(mobInput, mobDropdown, mobClear, mobForm);

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-bar-wrapper, .search-container, .search-form')) {
        document.querySelectorAll('.search-dropdown, #search-dropdown-menu').forEach(d => {
          d.style.display = 'none';
        });
      }
    });
  }

  return {
    init,
    performSearch,
    clearRecents
  };
})();

// Export globally
window.LocalMartSearch = LocalMartSearch;
window.BigBasketSearch = LocalMartSearch;

