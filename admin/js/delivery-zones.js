/**
 * ==============================================================================
 * BIG BASKET ADMIN - DELIVERY ZONES & SHIPPING MANAGEMENT CONTROLLER
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  DeliveryZonesController.init();
});

const DeliveryZonesController = (function () {
  let zones = [];
  const modal = document.getElementById('zoneModal');
  const form = document.getElementById('zoneForm');
  const tableBody = document.getElementById('zonesTableBody');

  const DEFAULT_ZONES = [
    {
      id: 1,
      name: 'Satnali Local Core',
      pincodes: '123024, 123025',
      city: 'Satnali',
      state: 'Haryana',
      delivery_fee: '30.00',
      free_delivery_threshold: '499.00',
      minimum_order: '99.00',
      estimated_min_minutes: 15,
      estimated_max_minutes: 30,
      is_active: true
    },
    {
      id: 2,
      name: 'Mahendragarh Outskirts',
      pincodes: '123029, 123034, 123001',
      city: 'Mahendragarh',
      state: 'Haryana',
      delivery_fee: '50.00',
      free_delivery_threshold: '799.00',
      minimum_order: '199.00',
      estimated_min_minutes: 30,
      estimated_max_minutes: 60,
      is_active: true
    }
  ];

  function init() {
    setupEventListeners();
    loadDeliveryZones();
  }

  function setupEventListeners() {
    const openBtn = document.getElementById('btnOpenAddZoneModal');
    const closeBtn = document.getElementById('btnCloseZoneModal');
    const cancelBtn = document.getElementById('btnCancelZone');

    if (openBtn) openBtn.addEventListener('click', () => openModal());
    if (closeBtn) closeBtn.addEventListener('click', () => closeModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal());

    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    }
  }

  async function loadDeliveryZones() {
    try {
      const res = await AdminAPI.get('/api/admin/delivery-zones');
      if (res && res.success && res.data) {
        zones = res.data;
      } else {
        zones = DEFAULT_ZONES;
      }
    } catch (e) {
      zones = DEFAULT_ZONES;
    }
    renderTable();
  }

  function renderTable() {
    if (!tableBody) return;

    if (zones.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4 text-muted">
            No delivery zones found. Click "+ Add Delivery Zone" to create one.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = zones.map(z => `
      <tr>
        <td>
          <strong style="color: #0f172a;">${z.name}</strong>
          <div style="font-size: 0.78rem; color: #64748b;">${z.city}, ${z.state}</div>
        </td>
        <td>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            ${z.pincodes.split(',').map(p => `<span class="badge badge-info" style="font-size: 0.75rem;">${p.trim()}</span>`).join('')}
          </div>
        </td>
        <td><strong>₹${parseFloat(z.delivery_fee).toFixed(0)}</strong></td>
        <td><span style="color: #16a34a; font-weight: 600;">₹${parseFloat(z.free_delivery_threshold).toFixed(0)}</span></td>
        <td>₹${parseFloat(z.minimum_order).toFixed(0)}</td>
        <td>⚡ ${z.estimated_min_minutes}–${z.estimated_max_minutes} mins</td>
        <td>
          <button class="badge ${z.is_active ? 'badge-success' : 'badge-danger'}" 
                  style="cursor: pointer; border: none;" 
                  onclick="DeliveryZonesController.toggleStatus(${z.id})">
            ${z.is_active ? 'Active' : 'Disabled'}
          </button>
        </td>
        <td class="text-right">
          <div class="table-actions">
            <button class="btn-icon" title="Edit" onclick="DeliveryZonesController.editZone(${z.id})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon text-danger" title="Delete" onclick="DeliveryZonesController.deleteZone(${z.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function openModal(zone = null) {
    document.getElementById('zoneModalTitle').textContent = zone ? 'Edit Delivery Zone' : 'Add Delivery Zone';
    document.getElementById('zoneId').value = zone ? zone.id : '';
    document.getElementById('zoneName').value = zone ? zone.name : '';
    document.getElementById('zonePincodes').value = zone ? zone.pincodes : '';
    document.getElementById('zoneCity').value = zone ? zone.city : 'Satnali';
    document.getElementById('zoneState').value = zone ? zone.state : 'Haryana';
    document.getElementById('zoneFee').value = zone ? parseFloat(zone.delivery_fee) : 30;
    document.getElementById('zoneFreeThreshold').value = zone ? parseFloat(zone.free_delivery_threshold) : 499;
    document.getElementById('zoneMinOrder').value = zone ? parseFloat(zone.minimum_order) : 99;
    document.getElementById('zoneEtaMin').value = zone ? zone.estimated_min_minutes : 15;
    document.getElementById('zoneEtaMax').value = zone ? zone.estimated_max_minutes : 30;
    document.getElementById('zoneIsActive').checked = zone ? zone.is_active : true;

    modal.classList.add('show');
  }

  function closeModal() {
    modal.classList.remove('show');
    form.reset();
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    const zoneId = document.getElementById('zoneId').value;
    const payload = {
      name: document.getElementById('zoneName').value.trim(),
      pincodes: document.getElementById('zonePincodes').value.trim(),
      city: document.getElementById('zoneCity').value.trim(),
      state: document.getElementById('zoneState').value.trim(),
      delivery_fee: parseFloat(document.getElementById('zoneFee').value),
      free_delivery_threshold: parseFloat(document.getElementById('zoneFreeThreshold').value),
      minimum_order: parseFloat(document.getElementById('zoneMinOrder').value),
      estimated_min_minutes: parseInt(document.getElementById('zoneEtaMin').value),
      estimated_max_minutes: parseInt(document.getElementById('zoneEtaMax').value),
      is_active: document.getElementById('zoneIsActive').checked
    };

    try {
      if (zoneId) {
        await AdminAPI.put(`/api/admin/delivery-zones/${zoneId}`, payload);
        AdminToast.show('Delivery zone updated successfully!', 'success');
      } else {
        await AdminAPI.post('/api/admin/delivery-zones', payload);
        AdminToast.show('Delivery zone created successfully!', 'success');
      }
      closeModal();
      await loadDeliveryZones();
    } catch (err) {
      AdminToast.show(err.message || 'Error saving delivery zone', 'danger');
    }
  }

  async function toggleStatus(id) {
    try {
      await AdminAPI.patch(`/api/admin/delivery-zones/${id}/status`, {});
      AdminToast.show('Delivery zone status updated!', 'success');
      await loadDeliveryZones();
    } catch (err) {
      AdminToast.show(err.message || 'Error updating status', 'danger');
    }
  }

  async function deleteZone(id) {
    AdminModal.confirm({
      title: 'Delete Delivery Zone',
      message: 'Are you sure you want to delete this delivery zone? Orders in this pincode may be blocked.',
      confirmText: 'Delete',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await AdminAPI.delete(`/api/admin/delivery-zones/${id}`);
          AdminToast.show('Delivery zone deleted', 'success');
          await loadDeliveryZones();
        } catch (err) {
          AdminToast.show(err.message || 'Error deleting zone', 'danger');
        }
      }
    });
  }

  function editZone(id) {
    const z = zones.find(item => item.id == id);
    if (z) openModal(z);
  }

  return {
    init,
    toggleStatus,
    editZone,
    deleteZone
  };
})();
