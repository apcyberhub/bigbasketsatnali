/**
 * ==============================================================================
 * BIG BASKET - UI HELPERS, TOAST NOTIFICATIONS & MICRO-INTERACTIONS
 * ==============================================================================
 */

const BigBasketUI = (function () {
  /**
   * Show a dynamic toast notification in the bottom corner
   */
  function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '✓';
    if (type === 'info') icon = 'ℹ';
    if (type === 'warning') icon = '⚠';

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: bold; color: ${type === 'success' ? '#4ade80' : '#38bdf8'};">${icon}</span>
        <span>${message}</span>
      </div>
      <button style="color: #94a3b8; background: none; border: none; font-size: 1.1rem; cursor: pointer;" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto remove after 3.5 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  return {
    showToast
  };
})();

// Export globally
window.BigBasketUI = BigBasketUI;
window.LocalMartUI = BigBasketUI;
