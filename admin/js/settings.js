/**
 * ==============================================================================
 * BIG BASKET ADMIN - STORE SETTINGS CONTROLLER
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  SettingsController.init();
});

const SettingsController = (function () {
  function init() {
    loadSettings();
    setupSettingsForm();
  }

  async function loadSettings() {
    try {
      const res = await AdminAPI.getSettings();
      if (!res || !res.success || !res.data) return;

      const s = res.data;
      document.getElementById('settingStoreName').value = s.store_name || 'Big Basket';
      document.getElementById('settingPhone').value = s.contact_phone || '9876543210';
      document.getElementById('settingEmail').value = s.contact_email || 'support@bigbasket.local';
      document.getElementById('settingAddress').value = s.store_address || 'Main Market, Satnali, Haryana - 123024';
      document.getElementById('settingDeliveryFee').value = s.delivery_charge || '25.00';
      document.getElementById('settingFreeThreshold').value = s.free_delivery_threshold || '199.00';
      document.getElementById('settingLowThreshold').value = s.low_stock_threshold_default || 10;
      document.getElementById('settingStoreStatus').value = s.store_status || 'open';

    } catch (err) {
      console.error(err);
      adminToast('Failed to load settings', 'danger');
    }
  }

  function setupSettingsForm() {
    const form = document.getElementById('storeSettingsForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const storeName = document.getElementById('settingStoreName').value.trim();
      const phone = document.getElementById('settingPhone').value.trim();
      const email = document.getElementById('settingEmail').value.trim();
      const address = document.getElementById('settingAddress').value.trim();
      const deliveryFee = parseFloat(document.getElementById('settingDeliveryFee').value) || 0;
      const freeThreshold = parseFloat(document.getElementById('settingFreeThreshold').value) || 0;
      const lowThreshold = parseInt(document.getElementById('settingLowThreshold').value) || 10;
      const storeStatus = document.getElementById('settingStoreStatus').value;

      const payload = {
        store_name: storeName,
        contact_phone: phone,
        contact_email: email,
        store_address: address,
        delivery_charge: deliveryFee.toFixed(2),
        free_delivery_threshold: freeThreshold.toFixed(2),
        low_stock_threshold_default: lowThreshold,
        store_status: storeStatus
      };

      const btn = document.getElementById('btnSaveSettings');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

      try {
        const res = await AdminAPI.updateSettings(payload);
        if (res && res.success) {
          adminToast('Store settings saved successfully!', 'success');
        } else {
          adminToast(res.error?.message || 'Failed to update settings', 'danger');
        }
      } catch (err) {
        adminToast(err.message, 'danger');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Save Settings';
      }
    });
  }

  return {
    init,
    refresh: loadSettings
  };
})();
