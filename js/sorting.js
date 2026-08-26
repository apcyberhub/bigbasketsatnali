/**
 * ==============================================================================
 * BIG BASKET - CATALOG SORTING CONTROLLER
 * ==============================================================================
 */

const BigBasketSorting = (function () {
  let currentSort = 'relevance';
  let onSortChange = null;

  function init(initialSort = 'relevance', callback = null) {
    currentSort = initialSort;
    onSortChange = callback;

    const sortSelects = document.querySelectorAll('.catalog-sort-select');
    sortSelects.forEach(select => {
      select.value = currentSort;
      select.addEventListener('change', (e) => {
        setSort(e.target.value);
      });
    });
  }

  function getSort() {
    return currentSort;
  }

  function setSort(val) {
    currentSort = val || 'relevance';
    document.querySelectorAll('.catalog-sort-select').forEach(sel => {
      sel.value = currentSort;
    });

    if (typeof onSortChange === 'function') {
      onSortChange(currentSort);
    }
  }

  return {
    init,
    getSort,
    setSort
  };
})();

window.BigBasketSorting = BigBasketSorting;
