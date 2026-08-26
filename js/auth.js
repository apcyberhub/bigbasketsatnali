/**
 * ==============================================================================
 * BIG BASKET - AUTHENTICATION & USER SESSION MANAGER
 * ==============================================================================
 * Manages customer registration, login, logout, profile updates, and route guards.
 * Uses localStorage for demo state; structured for seamless FastAPI + JWT integration.
 */

const BigBasketAuth = (function () {
  const CURRENT_USER_KEY = 'bigbasket_auth_user_v1';
  const USERS_DB_KEY = 'bigbasket_users_db_v1';

  // Default demo customer account
  const DEFAULT_USER = {
    id: 'user-001',
    name: 'Abhishek Sharma',
    full_name: 'Abhishek Sharma',
    mobile: '9876543210',
    phone: '9876543210',
    email: 'customer@example.com',
    password: 'password123',
    is_admin: false,
    joinedDate: 'August 2026',
    avatar: '👤'
  };

  function initUsersDB() {
    try {
      const stored = localStorage.getItem(USERS_DB_KEY);
      if (!stored) {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify([DEFAULT_USER]));
      }
    } catch (e) {
      console.warn('Error initializing users db:', e);
    }
  }

  function getUsers() {
    initUsersDB();
    try {
      const stored = localStorage.getItem(USERS_DB_KEY);
      return stored ? JSON.parse(stored) : [DEFAULT_USER];
    } catch (e) {
      return [DEFAULT_USER];
    }
  }

  function saveUsers(users) {
    try {
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Error saving users db:', e);
    }
  }

  function getCurrentUser() {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem('bigbasket_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  function setCurrentUser(user, remember = true) {
    try {
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        localStorage.setItem('bigbasket_user', JSON.stringify(user));
        if (user.token) {
          localStorage.setItem('bigbasket_auth_token', user.token);
        }
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem('bigbasket_user');
        localStorage.removeItem('bigbasket_auth_token');
        sessionStorage.removeItem('bigbasket_auth_token');
        sessionStorage.removeItem('bigbasket_user');
      }
    } catch (e) {
      console.warn('Error setting current user:', e);
    }
    updateHeaderAuthState();
  }

  function isLoggedIn() {
    return getCurrentUser() !== null;
  }

  /**
   * User Registration
   */
  async function registerUser(name, mobile, email, password) {
    initUsersDB();
    const users = getUsers();

    // Check duplicate email or mobile
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.mobile === mobile);
    if (existing) {
      return { success: false, message: 'An account with this email or mobile number already exists.' };
    }

    const newUser = {
      id: `user-${Date.now().toString(36)}`,
      name: name.trim(),
      full_name: name.trim(),
      mobile: mobile.trim(),
      phone: mobile.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      is_admin: false,
      joinedDate: 'August 2026',
      avatar: '👤'
    };

    // Try FastAPI Backend
    try {
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: mobile.trim(),
          password: password
        })
      });
      const data = await res.json();
      if (data && data.success && data.data) {
        newUser.token = data.data.access_token;
        newUser.is_admin = data.data.user?.is_admin || false;
      }
    } catch (e) {
      // Offline fallback
    }

    users.push(newUser);
    saveUsers(users);

    // Auto-login newly registered user
    setCurrentUser(newUser);

    return { success: true, user: newUser, message: 'Account created successfully! Welcome to Big Basket.' };
  }

  /**
   * User Login
   */
  async function loginUser(identifier, password, remember = true) {
    initUsersDB();
    const clean = identifier.trim().toLowerCase();

    // 1. Try FastAPI Backend
    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: clean, password: password })
      });
      const data = await res.json();
      if (data && data.success && data.data) {
        const u = data.data.user;
        const loggedUser = {
          id: u.id,
          name: u.full_name,
          full_name: u.full_name,
          email: u.email,
          mobile: u.phone,
          phone: u.phone,
          is_admin: u.is_admin,
          token: data.data.access_token,
          joinedDate: new Date(u.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' }),
          avatar: '👤'
        };
        setCurrentUser(loggedUser, remember);
        return { success: true, user: loggedUser };
      }
    } catch (e) {
      // Backend offline fallback to local database
    }

    // 2. Fallback to Local Storage
    const users = getUsers();
    const user = users.find(u => (u.email.toLowerCase() === clean || u.mobile === clean));

    if (!user) {
      if (clean === 'abhishek.sharma@example.com' || clean === '9876543210') {
        setCurrentUser(DEFAULT_USER, remember);
        return { success: true, user: DEFAULT_USER };
      }
      return { success: false, message: 'No account found with this email or mobile number.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    setCurrentUser(user, remember);
    return { success: true, user };
  }

  /**
   * User Logout with confirmation
   */
  function logoutUser(confirmPrompt = true) {
    if (confirmPrompt) {
      const confirmLogout = window.confirm('Are you sure you want to log out of Big Basket Satnali?');
      if (!confirmLogout) return false;
    }

    setCurrentUser(null);
    if (window.LocalMartUI) {
      window.LocalMartUI.showToast('You have been logged out successfully.', 'info');
    }
    window.location.href = 'index.html';
    return true;
  }

  /**
   * Update Profile Information
   */
  function updateProfile(name, email) {
    const current = getCurrentUser();
    if (!current) return { success: false, message: 'No active session.' };

    const users = getUsers();
    const idx = users.findIndex(u => u.id === current.id);
    if (idx !== -1) {
      users[idx].name = name.trim();
      users[idx].email = email.toLowerCase().trim();
      saveUsers(users);
      setCurrentUser(users[idx]);
      return { success: true, user: users[idx], message: 'Profile updated successfully!' };
    }
    return { success: false, message: 'User not found in storage.' };
  }

  /**
   * Change Password
   */
  function changePassword(oldPassword, newPassword) {
    const current = getCurrentUser();
    if (!current) return { success: false, message: 'No active session.' };

    const users = getUsers();
    const idx = users.findIndex(u => u.id === current.id);
    if (idx !== -1) {
      if (users[idx].password !== oldPassword) {
        return { success: false, message: 'Current password is incorrect.' };
      }
      users[idx].password = newPassword;
      saveUsers(users);
      setCurrentUser(users[idx]);
      return { success: true, message: 'Password changed successfully!' };
    }
    return { success: false, message: 'User not found.' };
  }

  /**
   * Route Guard: Protects pages requiring customer login
   */
  function requireAuth(redirectUrl = null) {
    if (!isLoggedIn()) {
      const target = redirectUrl || window.location.pathname.split('/').pop() || 'account.html';
      window.location.href = `login.html?redirect=${encodeURIComponent(target)}`;
      return false;
    }
    return true;
  }

  /**
   * Updates Header Account Button & Dropdown dynamically
   */
  function updateHeaderAuthState() {
    const user = getCurrentUser();
    const accountButtons = document.querySelectorAll('.account-btn, #header-account-btn');

    accountButtons.forEach(btn => {
      if (user) {
        const firstName = user.name.split(' ')[0] || 'Account';
        btn.innerHTML = `
          <span class="action-icon" aria-hidden="true">👤</span>
          <span class="action-label">${firstName} ▾</span>
        `;
        btn.href = 'account.html';
        btn.classList.add('logged-in');

        // Create or attach dropdown if not already created
        let dropdown = btn.parentElement.querySelector('.account-dropdown-menu');
        if (!dropdown) {
          dropdown = document.createElement('div');
          dropdown.className = 'account-dropdown-menu';
          btn.parentElement.style.position = 'relative';
          btn.parentElement.appendChild(dropdown);
        }

        dropdown.innerHTML = `
          <div class="account-dropdown-header">
            <div class="user-name">${user.name}</div>
            <div class="user-phone">${user.mobile || user.email}</div>
          </div>
          <ul class="account-dropdown-list">
            <li><a href="account.html">🏠 My Account</a></li>
            <li><a href="orders.html">📦 My Orders</a></li>
            <li><a href="wishlist.html">❤️ My Wishlist</a></li>
            <li><a href="addresses.html">📍 Saved Addresses</a></li>
            <li><a href="profile.html">⚙️ Profile Settings</a></li>
            <li class="dropdown-divider"></li>
            <li><button type="button" class="btn-dropdown-logout" onclick="BigBasketAuth.logoutUser()">🚪 Logout</button></li>
          </ul>
        `;

        // Toggle on hover / click
        btn.onmouseenter = () => dropdown.classList.add('active');
        btn.parentElement.onmouseleave = () => dropdown.classList.remove('active');
      } else {
        btn.innerHTML = `
          <span class="action-icon" aria-hidden="true">👤</span>
          <span class="action-label">Login</span>
        `;
        btn.href = 'login.html';
        btn.classList.remove('logged-in');

        const dropdown = btn.parentElement.querySelector('.account-dropdown-menu');
        if (dropdown) dropdown.remove();
      }
    });
  }

  return {
    init() {
      initUsersDB();
      updateHeaderAuthState();
    },
    isLoggedIn,
    getCurrentUser,
    registerUser,
    loginUser,
    logoutUser,
    updateProfile,
    changePassword,
    requireAuth,
    updateHeaderAuthState
  };
})();

// Export globally
window.BigBasketAuth = BigBasketAuth;
window.LocalMartAuth = BigBasketAuth;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  BigBasketAuth.init();
});
