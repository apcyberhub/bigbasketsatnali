/**
 * ==============================================================================
 * LOCALMART - LOCATION SELECTOR & DELIVERY MODAL
 * ==============================================================================
 */

const LocalMartLocation = (function () {
  const STORAGE_KEY = 'localmart_location_v1';

  // Popular local areas for quick selection
  const POPULAR_LOCATIONS = [
    { city: 'Bengaluru', area: 'Indiranagar, 100ft Road', pincode: '560038', time: '10 mins' },
    { city: 'Bengaluru', area: 'Koramangala, 5th Block', pincode: '560034', time: '12 mins' },
    { city: 'Mumbai', area: 'Bandra West, Hill Road', pincode: '400050', time: '15 mins' },
    { city: 'Mumbai', area: 'Andheri West, Lokhandwala', pincode: '400053', time: '15 mins' },
    { city: 'New Delhi', area: 'Connaught Place, Central', pincode: '110001', time: '15 mins' },
    { city: 'New Delhi', area: 'Hauz Khas, South Delhi', pincode: '110016', time: '12 mins' },
    { city: 'Hyderabad', area: 'Hitec City, Madhapur', pincode: '500081', time: '10 mins' },
    { city: 'Pune', area: 'Kothrud, DP Road', pincode: '411038', time: '12 mins' }
  ];

  let currentLocation = {
    city: 'Bengaluru',
    area: 'Indiranagar',
    pincode: '560038',
    time: '10 mins'
  };

  function loadLocation() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        currentLocation = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error loading location from localStorage', e);
    }
  }

  function saveLocation(loc) {
    currentLocation = { ...currentLocation, ...loc };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentLocation));
    } catch (e) {
      console.warn('Error saving location to localStorage', e);
    }
    updateLocationUI();
    closeModal();
    if (window.LocalMartUI && window.LocalMartUI.showToast) {
      window.LocalMartUI.showToast(`Delivering to ${currentLocation.area}, ${currentLocation.pincode}`, 'info');
    }
  }

  function updateLocationUI() {
    // Update Desktop Header
    document.querySelectorAll('.current-location-display').forEach(el => {
      el.textContent = `${currentLocation.area}, ${currentLocation.pincode}`;
    });

    // Update Mobile Header
    document.querySelectorAll('.mobile-location-text').forEach(el => {
      el.textContent = `${currentLocation.area} (${currentLocation.time})`;
    });
  }

  function openModal() {
    const modal = document.getElementById('location-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      renderPopularList();
      const input = document.getElementById('pincode-input');
      if (input) {
        input.value = '';
        input.focus();
      }
    }
  }

  function closeModal() {
    const modal = document.getElementById('location-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function renderPopularList() {
    const container = document.getElementById('popular-locations-list');
    if (!container) return;

    container.innerHTML = POPULAR_LOCATIONS.map(loc => `
      <div class="location-item-row" style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 0.5rem; cursor: pointer; transition: all 0.2s;" onclick="LocalMartLocation.selectLocation('${loc.city}', '${loc.area}', '${loc.pincode}', '${loc.time}')">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.1rem; color: #d8232a;">📍</span>
          <div>
            <div style="font-size: 0.82rem; font-weight: 700; color: #1e293b;">${loc.area}</div>
            <div style="font-size: 0.72rem; color: #64748b;">${loc.city} • Pincode: ${loc.pincode}</div>
          </div>
        </div>
        <span style="font-size: 0.7rem; font-weight: 700; color: #d8232a; background: #fef2f2; padding: 2px 6px; border-radius: 4px;">⚡ ${loc.time}</span>
      </div>
    `).join('');
  }

  function selectLocation(city, area, pincode, time = '15 mins') {
    saveLocation({ city, area, pincode, time });
  }

  function handlePincodeSubmit(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('pincode-input');
    if (!input) return;

    const val = input.value.trim();
    if (!/^\d{6}$/.test(val)) {
      alert('Please enter a valid 6-digit Indian Pincode.');
      return;
    }

    // Mock resolve area by pincode
    saveLocation({
      city: 'Local Zone',
      area: `Area ${val}`,
      pincode: val,
      time: '15 mins'
    });
  }

  function handleDetectLocation() {
    const statusEl = document.getElementById('detect-location-status');
    if (statusEl) statusEl.textContent = 'Detecting nearest market...';

    // Simulate location detection
    setTimeout(() => {
      saveLocation({
        city: 'Bengaluru',
        area: 'Indiranagar Central',
        pincode: '560038',
        time: '10 mins'
      });
      if (statusEl) statusEl.textContent = '';
    }, 600);
  }

  function init() {
    loadLocation();
    updateLocationUI();

    // Bind triggers
    document.querySelectorAll('.location-modal-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });

    const modal = document.getElementById('location-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    const closeBtn = document.getElementById('location-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    const detectBtn = document.getElementById('btn-detect-location');
    if (detectBtn) {
      detectBtn.addEventListener('click', handleDetectLocation);
    }

    const form = document.getElementById('pincode-form');
    if (form) {
      form.addEventListener('submit', handlePincodeSubmit);
    }
  }

  return {
    init,
    openModal,
    closeModal,
    selectLocation,
    getLocation: () => ({ ...currentLocation })
  };
})();

// Export globally
window.LocalMartLocation = LocalMartLocation;
window.BigBasketLocation = LocalMartLocation;
