/**
 * ==============================================================================
 * BIG BASKET - SAVED ADDRESSES MANAGER
 * ==============================================================================
 */

const BigBasketAddresses = (function () {
  const STORAGE_KEY = 'bigbasket_addresses_v1';

  const DEFAULT_ADDRESSES = [
    {
      id: 'addr-001',
      name: 'Abhishek Sharma',
      mobile: '9876543210',
      house: 'House #42, Near Old Bus Stand',
      street: 'Main Market Road',
      landmark: 'Opposite State Bank',
      city: 'Satnali',
      state: 'Haryana',
      pincode: '123024',
      type: 'Home',
      isDefault: true
    },
    {
      id: 'addr-002',
      name: 'Abhishek Sharma',
      mobile: '9876543210',
      house: 'Shop #12, First Floor',
      street: 'Railway Station Commercial Complex',
      landmark: 'Near Railway Crossing',
      city: 'Satnali',
      state: 'Haryana',
      pincode: '123024',
      type: 'Work',
      isDefault: false
    }
  ];

  function load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ADDRESSES));
      return DEFAULT_ADDRESSES;
    } catch (e) {
      console.warn('Error loading addresses:', e);
      return DEFAULT_ADDRESSES;
    }
  }

  function save(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Error saving addresses:', e);
    }
  }

  function getAddresses() {
    return load();
  }

  function getAddress(id) {
    const list = load();
    return list.find(a => a.id === id) || null;
  }

  function addAddress(data) {
    const list = load();
    const isFirst = list.length === 0;
    const shouldBeDefault = data.isDefault || isFirst;

    if (shouldBeDefault) {
      list.forEach(a => a.isDefault = false);
    }

    const newAddr = {
      id: `addr-${Date.now().toString(36)}`,
      ...data,
      isDefault: shouldBeDefault
    };

    list.push(newAddr);
    save(list);
    return newAddr;
  }

  function updateAddress(id, data) {
    const list = load();
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return false;

    if (data.isDefault) {
      list.forEach(a => a.isDefault = false);
    }

    list[idx] = { ...list[idx], ...data, id };
    save(list);
    return true;
  }

  function deleteAddress(id) {
    let list = load();
    const target = list.find(a => a.id === id);
    if (!target) return false;

    list = list.filter(a => a.id !== id);
    if (target.isDefault && list.length > 0) {
      list[0].isDefault = true;
    }
    save(list);
    return true;
  }

  function setDefault(id) {
    const list = load();
    list.forEach(a => a.isDefault = (a.id === id));
    save(list);
  }

  /**
   * Render Address Cards Grid in addresses.html
   */
  function renderAddressesList(containerId = 'addresses-grid') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const list = getAddresses();

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg);">
          <div style="font-size: 3rem; margin-bottom: 0.75rem;">📍</div>
          <h3>No Saved Addresses</h3>
          <p style="color: var(--color-text-secondary); margin-bottom: 1.5rem;">Add your delivery address for superfast checkout.</p>
          <button type="button" class="btn btn-primary" onclick="BigBasketAddresses.openModal()">+ Add New Address</button>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(addr => `
      <div class="address-manage-card ${addr.isDefault ? 'is-default' : ''}">
        <div class="address-card-top">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="address-type-badge">${addr.type || 'Home'}</span>
            ${addr.isDefault ? '<span class="default-badge">✓ Default</span>' : ''}
          </div>
          <div class="address-actions-menu">
            <button type="button" class="btn-address-action" onclick="BigBasketAddresses.openModal('${addr.id}')" title="Edit Address">✏️ Edit</button>
            <button type="button" class="btn-address-action" onclick="BigBasketAddresses.handleDelete('${addr.id}')" title="Delete Address">🗑️ Delete</button>
          </div>
        </div>

        <h3 class="address-recipient">${addr.name}</h3>
        <p class="address-phone">📞 +91 ${addr.mobile}</p>
        <p class="address-full">
          ${addr.house}, ${addr.street}<br>
          ${addr.landmark ? 'Landmark: ' + addr.landmark + '<br>' : ''}
          ${addr.city}, ${addr.state} - <strong>${addr.pincode}</strong>
        </p>

        ${!addr.isDefault ? `
          <div class="address-card-footer">
            <button type="button" class="btn-set-default" onclick="BigBasketAddresses.handleSetDefault('${addr.id}')">
              Set as Default Address
            </button>
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  function handleSetDefault(id) {
    setDefault(id);
    renderAddressesList();
    if (window.LocalMartUI) {
      window.LocalMartUI.showToast('Default delivery address updated!', 'success');
    }
  }

  function handleDelete(id) {
    if (confirm('Are you sure you want to delete this address?')) {
      deleteAddress(id);
      renderAddressesList();
      if (window.LocalMartUI) {
        window.LocalMartUI.showToast('Address deleted.', 'info');
      }
    }
  }

  /**
   * Modal Management
   */
  function openModal(editId = null) {
    let modal = document.getElementById('address-modal');
    if (!modal) return;

    const form = document.getElementById('address-form');
    const title = document.getElementById('address-modal-title');
    const editIdInput = document.getElementById('address-edit-id');

    if (form) form.reset();

    if (editId) {
      const addr = getAddress(editId);
      if (addr) {
        if (title) title.textContent = 'Edit Delivery Address';
        if (editIdInput) editIdInput.value = addr.id;
        document.getElementById('addr-name').value = addr.name || '';
        document.getElementById('addr-mobile').value = addr.mobile || '';
        document.getElementById('addr-house').value = addr.house || '';
        document.getElementById('addr-street').value = addr.street || '';
        document.getElementById('addr-landmark').value = addr.landmark || '';
        document.getElementById('addr-city').value = addr.city || 'Satnali';
        document.getElementById('addr-state').value = addr.state || 'Haryana';
        document.getElementById('addr-pincode').value = addr.pincode || '123024';
        
        const typeRadio = document.querySelector(`input[name="addr-type"][value="${addr.type}"]`);
        if (typeRadio) typeRadio.checked = true;

        const defaultCheck = document.getElementById('addr-is-default');
        if (defaultCheck) defaultCheck.checked = Boolean(addr.isDefault);
      }
    } else {
      if (title) title.textContent = 'Add New Delivery Address';
      if (editIdInput) editIdInput.value = '';
      const user = window.BigBasketAuth ? window.BigBasketAuth.getCurrentUser() : null;
      if (user) {
        document.getElementById('addr-name').value = user.name || '';
        document.getElementById('addr-mobile').value = user.mobile || '';
      }
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = document.getElementById('address-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('address-edit-id').value;

    const name = document.getElementById('addr-name').value.trim();
    const mobile = document.getElementById('addr-mobile').value.trim();
    const house = document.getElementById('addr-house').value.trim();
    const street = document.getElementById('addr-street').value.trim();
    const landmark = document.getElementById('addr-landmark').value.trim();
    const city = document.getElementById('addr-city').value.trim();
    const state = document.getElementById('addr-state').value.trim();
    const pincode = document.getElementById('addr-pincode').value.trim();
    const typeEl = document.querySelector('input[name="addr-type"]:checked');
    const isDefault = document.getElementById('addr-is-default').checked;

    if (!name || !mobile || !house || !street || !pincode) {
      alert('Please fill all required fields.');
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      alert('Please enter a valid 6-digit Pincode.');
      return;
    }

    const payload = {
      name,
      mobile,
      house,
      street,
      landmark,
      city,
      state,
      pincode,
      type: typeEl ? typeEl.value : 'Home',
      isDefault
    };

    if (editId) {
      updateAddress(editId, payload);
      if (window.LocalMartAPI && window.LocalMartAPI.saveAddress) {
        window.LocalMartAPI.saveAddress({ ...payload, id: editId });
      }
      if (window.LocalMartUI) window.LocalMartUI.showToast('Address updated successfully!', 'success');
    } else {
      addAddress(payload);
      if (window.LocalMartAPI && window.LocalMartAPI.saveAddress) {
        window.LocalMartAPI.saveAddress(payload);
      }
      if (window.LocalMartUI) window.LocalMartUI.showToast('New address saved!', 'success');
    }

    closeModal();
    renderAddressesList();
  }

  return {
    getAddresses,
    getAddress,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefault,
    renderAddressesList,
    handleSetDefault,
    handleDelete,
    openModal,
    closeModal,
    handleFormSubmit
  };
})();

// Export globally
window.BigBasketAddresses = BigBasketAddresses;
