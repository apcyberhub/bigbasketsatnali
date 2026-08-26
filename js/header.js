/**
 * ==============================================================================
 * BIG BASKET - HEADER & MOBILE DRAWER CONTROLLER
 * ==============================================================================
 */

const BigBasketHeader = (function () {
  function initStickyHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  function initMobileDrawer() {
    const openBtn = document.getElementById('mobile-menu-open-btn');
    const closeBtn = document.getElementById('mobile-drawer-close');
    const drawer = document.getElementById('mobile-nav-drawer');
    const overlay = document.getElementById('mobile-drawer-overlay');

    if (!drawer || !overlay) return;

    function open() {
      drawer.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
  }

  function init() {
    initStickyHeader();
    initMobileDrawer();
  }

  return { init };
})();

// Export globally
window.BigBasketHeader = BigBasketHeader;
window.LocalMartHeader = BigBasketHeader;
