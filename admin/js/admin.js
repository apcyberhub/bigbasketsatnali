/**
 * ==============================================================================
 * BIG BASKET ADMIN - CORE CONTROLLER & AUTHENTICATION GUARD
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  AdminCore.init();
});

const AdminCore = (function () {
  let currentUser = null;

  function init() {
    checkAdminAuth();
    setupSidebarToggle();
    setupActiveNavLink();
    setupUserDisplay();
    setupLogout();
  }

  function checkAdminAuth() {
    const token = localStorage.getItem('bigbasket_auth_token') || sessionStorage.getItem('bigbasket_auth_token');
    const userStr = localStorage.getItem('bigbasket_user') || sessionStorage.getItem('bigbasket_user');

    if (!token || !userStr) {
      redirectToLogin();
      return;
    }

    try {
      currentUser = JSON.parse(userStr);
      if (!currentUser.is_admin) {
        alert('Access Denied: Administrator privileges required.');
        window.location.href = '/account.html';
        return;
      }
    } catch (e) {
      redirectToLogin();
    }
  }

  function redirectToLogin() {
    window.location.href = 'login.html';
  }

  function setupSidebarToggle() {
    const toggleBtn = document.getElementById('btnSidebarToggle');
    const sidebar = document.querySelector('.admin-sidebar');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('show');
      });

      // Close sidebar when clicking outside on mobile
      document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
          if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target) && sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
          }
        }
      });
    }
  }

  function setupActiveNavLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.sidebar-menu .nav-link');

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === currentPath || (currentPath === '' && href === 'index.html'))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function setupUserDisplay() {
    if (!currentUser) return;

    const nameEls = document.querySelectorAll('.user-name, #adminUserName');
    const avatarEls = document.querySelectorAll('.user-avatar');

    nameEls.forEach(el => {
      el.textContent = currentUser.full_name || 'Admin';
    });

    const initials = (currentUser.full_name || 'AD')
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    avatarEls.forEach(el => {
      el.textContent = initials;
    });
  }

  function setupLogout() {
    const logoutBtns = document.querySelectorAll('.btn-logout-admin, #btnLogoutAdmin');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        AdminModal.confirm({
          title: 'Confirm Logout',
          message: 'Are you sure you want to sign out from the Admin Dashboard?',
          confirmText: 'Logout',
          confirmClass: 'btn-danger',
          onConfirm: () => {
            localStorage.removeItem('bigbasket_auth_token');
            sessionStorage.removeItem('bigbasket_auth_token');
            localStorage.removeItem('bigbasket_user');
            sessionStorage.removeItem('bigbasket_user');
            window.location.href = 'login.html';
          }
        });
      });
    });
  }

  return {
    init,
    getCurrentUser: () => currentUser
  };
})();

/**
 * ==============================================================================
 * GLOBAL ADMIN TOAST HELPER
 * ==============================================================================
 */
function adminToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: 'fa-check-circle',
    warning: 'fa-exclamation-triangle',
    danger: 'fa-times-circle',
    info: 'fa-info-circle'
  };

  const icon = iconMap[type] || iconMap.info;

  toast.innerHTML = `
    <i class="fas ${icon}" style="font-size: 1.2rem; color: inherit;"></i>
    <span style="font-size: 0.875rem; font-weight: 500;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * ==============================================================================
 * GLOBAL ADMIN CONFIRMATION MODAL HELPER
 * ==============================================================================
 */
const AdminModal = {
  confirm({ title = 'Confirmation', message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel', confirmClass = 'btn-primary', onConfirm }) {
    let backdrop = document.getElementById('globalAdminModal');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'globalAdminModal';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    backdrop.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" onclick="AdminModal.close()">&times;</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 0.95rem; color: var(--admin-text-main);">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="AdminModal.close()">${cancelText}</button>
          <button class="btn ${confirmClass}" id="modalBtnConfirm">${confirmText}</button>
        </div>
      </div>
    `;

    backdrop.classList.add('show');

    const confirmBtn = backdrop.querySelector('#modalBtnConfirm');
    confirmBtn.onclick = () => {
      AdminModal.close();
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
    };
  },

  close() {
    const backdrop = document.getElementById('globalAdminModal');
    if (backdrop) {
      backdrop.classList.remove('show');
    }
  }
};

window.adminToast = adminToast;
window.AdminModal = AdminModal;
