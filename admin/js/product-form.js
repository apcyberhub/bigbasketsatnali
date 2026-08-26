/**
 * ==============================================================================
 * BIG BASKET ADMIN - PRODUCT ADD / EDIT FORM CONTROLLER
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  ProductFormController.init();
});

const ProductFormController = (function () {
  let editProductId = null;
  let selectedImageUrl = null;

  function init() {
    const urlParams = new URLSearchParams(window.location.search);
    editProductId = urlParams.get('id');

    loadCategories().then(() => {
      if (editProductId) {
        setupEditMode(editProductId);
      }
    });

    setupCalculators();
    setupImageUploader();
    setupFormSubmission();
  }

  const SUBCATEGORY_MAP = {
    1: ['Fresh Fruits', 'Fresh Vegetables', 'Exotic & Organic', 'Herbs & Seasonings'],
    2: ['Atta & Flours', 'Rice & Rice Products', 'Dals & Pulses', 'Grains & Millets'],
    3: ['Milk', 'Butter & Cream', 'Cheese & Paneer', 'Yogurt & Curd', 'Eggs', 'Breads & Spreads'],
    4: ['Fresh Bread', 'Buns & Pav', 'Cakes & Pastries', 'Rusk & Khari'],
    5: ['Glucose & Marie Biscuits', 'Cookies & Crackers', 'Cream Biscuits', 'Wafers'],
    6: ['Namkeen & Bhujia', 'Chips & Crisps', 'Dry Snacks', 'Roasted Snacks'],
    7: ['Chocolates', 'Mithai & Sweets', 'Toffees & Candies', 'Dessert Mixes'],
    8: ['Tea & Green Tea', 'Coffee', 'Juices & Syrups', 'Soft Drinks & Sodas', 'Energy Drinks'],
    9: ['Noodles & Pasta', 'Instant Ready Mixes', 'Soups', 'Breakfast Cereals & Oats'],
    10: ['Whole Spices', 'Powdered Spices', 'Cooking Pastes & Masalas', 'Salt & Sugar'],
    11: ['Refined Cooking Oils', 'Mustard & Groundnut Oil', 'Desi Ghee & Vanaspati', 'Olive & Cold Pressed Oils'],
    12: ['Soaps & Body Wash', 'Shampoos & Conditioners', 'Oral Care & Toothpaste', 'Deodorants & Perfumes'],
    13: ['Face Care & Creams', 'Body Lotions', 'Lip Care', 'Makeup & Styling'],
    14: ['Pooja Needs', 'Batteries & Bulbs', 'Kitchen Rolls & Foils', 'Shoe Care'],
    15: ['Floor Cleaners', 'Dishwash Liquids & Bars', 'Detergents & Fabric Care', 'Toilet & Glass Cleaners'],
    16: ['Diapers & Wipes', 'Baby Food & Formula', 'Baby Bath & Skin Care', 'Baby Accessories'],
    17: ['Educational Toys', 'Outdoor & Sports Toys', 'Board Games & Puzzles', 'Dolls & Action Figures'],
    18: ['Notebooks & Pens', 'Art & Craft Supplies', 'Desk Accessories', 'Files & Envelopes'],
    19: ['Cookware & Pans', 'Kitchen Tools & Cutlery', 'Storage Containers & Jars', 'Tableware'],
    20: ['Cables & Chargers', 'Audio & Earphones', 'Smart Accessories', 'Small Appliances'],
    21: ['Dog Food & Treats', 'Cat Food & Treats', 'Pet Hygiene & Shampoos', 'Pet Toys & Accessories']
  };

  function updateSubcategories(catId) {
    const subInput = document.getElementById('prodSubcategory');
    if (!subInput) return;

    let datalist = document.getElementById('subcategoryDatalist');
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = 'subcategoryDatalist';
      document.body.appendChild(datalist);
      subInput.setAttribute('list', 'subcategoryDatalist');
    }

    const subs = SUBCATEGORY_MAP[Number(catId)] || [];
    datalist.innerHTML = subs.map(s => `<option value="${s}">`).join('');
  }

  async function loadCategories() {
    const select = document.getElementById('prodCategory');
    if (!select) return;

    // Attach change listener for dynamic subcategories
    select.addEventListener('change', () => {
      updateSubcategories(select.value);
    });

    try {
      select.innerHTML = '<option value="">Loading categories...</option>';
      const res = await AdminAPI.getCategories();
      let list = [];
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        list = res.data;
      } else if (res && Array.isArray(res.categories) && res.categories.length > 0) {
        list = res.categories;
      } else if (Array.isArray(res) && res.length > 0) {
        list = res;
      }

      if (list.length > 0) {
        select.innerHTML = '<option value="">Select Category</option>';
        list.forEach(cat => {
          if (cat.is_active !== false) {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = `${cat.icon || '🏷️'} ${cat.name}`.trim();
            select.appendChild(opt);
          }
        });
      } else {
        const fallbackCats = [
          { id: 1, name: 'Fruits & Vegetables', icon: '🥦' },
          { id: 2, name: 'Atta, Rice & Dal', icon: '🌾' },
          { id: 3, name: 'Dairy & Breakfast', icon: '🥛' },
          { id: 4, name: 'Bakery & Bread', icon: '🍞' },
          { id: 5, name: 'Biscuits & Cookies', icon: '🍪' },
          { id: 6, name: 'Snacks & Namkeen', icon: '🥨' },
          { id: 7, name: 'Chocolates & Sweets', icon: '🍫' },
          { id: 8, name: 'Beverages & Juices', icon: '🥤' },
          { id: 9, name: 'Instant Food & Noodles', icon: '🍜' },
          { id: 10, name: 'Masala & Spices', icon: '🌶️' },
          { id: 11, name: 'Edible Oil & Ghee', icon: '🛢️' },
          { id: 12, name: 'Personal Care & Hygiene', icon: '🧴' },
          { id: 13, name: 'Beauty & Skincare', icon: '💄' },
          { id: 14, name: 'Household Essentials', icon: '🧼' },
          { id: 15, name: 'Cleaning & Floor Care', icon: '🧹' },
          { id: 16, name: 'Baby Care & Diapers', icon: '👶' },
          { id: 17, name: 'Toys, Kids & Games', icon: '🧸' },
          { id: 18, name: 'Stationery & Office', icon: '✏️' },
          { id: 19, name: 'Home & Kitchen', icon: '🍳' },
          { id: 20, name: 'Electronics & Gadgets', icon: '🔌' },
          { id: 21, name: 'Pet Supplies & Food', icon: '🐕' }
        ];
        select.innerHTML = '<option value="">Select Category</option>';
        fallbackCats.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat.id;
          opt.textContent = `${cat.icon} ${cat.name}`;
          select.appendChild(opt);
        });
      }
    } catch (e) {
      console.error('Error loading categories:', e);
      select.innerHTML = '<option value="">Select Category</option>';
    }
  }

  async function setupEditMode(id) {
    document.getElementById('formTitle').textContent = 'Edit Product';
    document.getElementById('formSubtitle').textContent = `Updating Product #${id}`;
    document.getElementById('btnSubmitProduct').innerHTML = '<i class="fas fa-save"></i> Update Product';

    try {
      const res = await AdminAPI.getProduct(id);
      if (!res || !res.success || !res.data) {
        throw new Error(res.error?.message || 'Product not found');
      }

      const p = res.data;
      document.getElementById('prodName').value = p.name || '';
      document.getElementById('prodSku').value = p.sku || '';
      document.getElementById('prodBrand').value = p.brand || '';
      document.getElementById('prodCategory').value = p.category_id || '';
      document.getElementById('prodSubcategory').value = p.subcategory_name || '';
      document.getElementById('prodPrice').value = p.price || '';
      document.getElementById('prodMrp').value = p.mrp || '';
      document.getElementById('prodStock').value = p.stock_quantity || 0;
      document.getElementById('prodLowThreshold').value = p.low_stock_threshold || 10;
      document.getElementById('prodUnit').value = p.unit || 'piece';
      document.getElementById('prodWeight').value = p.weight || '';
      document.getElementById('prodEmoji').value = p.emoji || '🛒';
      document.getElementById('prodBadge').value = p.badge || '';
      document.getElementById('prodEta').value = p.eta || '10–15 mins';
      document.getElementById('prodTags').value = p.tags || '';
      document.getElementById('prodShortDesc').value = p.short_description || '';
      document.getElementById('prodDescription').value = p.description || '';
      document.getElementById('prodIsActive').checked = p.is_active;
      document.getElementById('prodIsFeatured').checked = p.is_featured;

      calculateDiscount();

      if (p.images && p.images.length > 0 && p.images[0].image_url) {
        showImagePreview(p.images[0].image_url, true);
      } else if (p.image_url) {
        showImagePreview(p.image_url, true);
      }
    } catch (err) {
      adminToast(err.message, 'danger');
    }
  }

  function setupCalculators() {
    const priceInput = document.getElementById('prodPrice');
    const mrpInput = document.getElementById('prodMrp');

    if (priceInput && mrpInput) {
      priceInput.addEventListener('input', calculateDiscount);
      mrpInput.addEventListener('input', calculateDiscount);
    }
  }

  function calculateDiscount() {
    const price = parseFloat(document.getElementById('prodPrice').value) || 0;
    const mrp = parseFloat(document.getElementById('prodMrp').value) || 0;
    const discountEl = document.getElementById('prodCalculatedDiscount');

    if (mrp > 0 && mrp >= price) {
      const discount = Math.round(((mrp - price) / mrp) * 100);
      if (discountEl) {
        discountEl.value = `${discount}% OFF (Saving ₹${(mrp - price).toFixed(2)})`;
      }
    } else if (price > mrp && mrp > 0) {
      if (discountEl) discountEl.value = '⚠️ MRP must be >= Price';
    } else {
      if (discountEl) discountEl.value = '0% OFF';
    }
  }

  let currentObjectUrl = null;
  let selectedFile = null;

  function setupImageUploader() {
    const fileInput = document.getElementById('product-image-input');
    if (!fileInput) return;

    fileInput.addEventListener('change', (e) => {
      console.log('[IMAGE] change event fired');
      const file = e.target.files && e.target.files[0];
      if (!file) {
        console.log('[IMAGE] no file selected');
        return;
      }

      console.log('[IMAGE] file selected:', file.name);

      // Client-side file type validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      const ext = file.name.split('.').pop().toLowerCase();
      const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];

      if (!allowedTypes.includes(file.type.toLowerCase()) && !allowedExts.includes(ext)) {
        adminToast('Invalid file format. Image must be JPG, PNG, or WEBP.', 'warning');
        fileInput.value = '';
        return;
      }

      // Client-side file size validation (Max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        adminToast('Image size is too large (Max 5MB allowed).', 'warning');
        fileInput.value = '';
        return;
      }

      selectedFile = file;
      selectedImageUrl = null;

      // Revoke previous object URL
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
      }

      // Instant local preview without triggering premature server disk writes
      currentObjectUrl = URL.createObjectURL(file);
      const formattedSize = file.size > 1024 * 1024
        ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
        : (file.size / 1024).toFixed(1) + ' KB';

      showImagePreview(currentObjectUrl, false, file.name, formattedSize);
      adminToast('Image attached: ' + file.name, 'info');
    });
  }

  function showImagePreview(url, isServerUrl = true, fileName = null, fileSize = null) {
    const dropzone = document.getElementById('imageUploadZone');
    if (!dropzone) return;

    if (isServerUrl) {
      selectedImageUrl = url;
      selectedFile = null;
    }

    // Resolve relative path for admin subdirectory if needed
    const displayUrl = (url && !url.startsWith('blob:') && !url.startsWith('data:') && !url.startsWith('http') && !url.startsWith('../') && !url.startsWith('/')) 
      ? `../${url}` 
      : url;

    const nameText = fileName || 'product-image.jpg';
    const sizeText = fileSize || 'Image attached';

    dropzone.innerHTML = `
      <div class="image-preview-wrapper" style="display: flex; align-items: center; gap: 15px; width: 100%;">
        <img src="${displayUrl}" class="preview-thumb" alt="Product Image" style="width: 80px; height: 80px; object-fit: contain; border-radius: 6px; border: 1px solid var(--admin-border); background: #fff;" onerror="this.src='../assets/logo.png'">
        <div style="flex: 1; text-align: left;">
          <p style="font-size: 0.85rem; font-weight: 700; margin-bottom: 2px; color: var(--admin-text); word-break: break-all;">${nameText}</p>
          <p style="font-size: 0.75rem; color: var(--admin-text-muted); margin-bottom: 8px;">${sizeText}</p>
          <div style="display: flex; gap: 12px; align-items: center;">
            <button type="button" class="btn-remove-image" onclick="ProductFormController.removeImage(event)" style="background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; border-radius: 4px; padding: 4px 10px; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
              <i class="fas fa-trash"></i> Remove
            </button>
            <label for="product-image-input" style="font-size: 0.78rem; color: var(--admin-primary); font-weight: 600; cursor: pointer; text-decoration: underline;">
              <i class="fas fa-redo"></i> Change Image
            </label>
          </div>
        </div>
      </div>
    `;
    dropzone.classList.add('has-image');
  }

  function removeImage(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
    selectedFile = null;
    selectedImageUrl = null;
    const fileInput = document.getElementById('product-image-input');
    if (fileInput) {
      fileInput.value = '';
    }
    const dropzone = document.getElementById('imageUploadZone');
    if (dropzone) {
      dropzone.classList.remove('has-image');
      dropzone.innerHTML = `
        <label for="product-image-input" class="upload-trigger" style="display: block; cursor: pointer; width: 100%; height: 100%;">
          <div class="upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
          <div class="upload-text">Click to upload product image</div>
          <div class="upload-subtext">JPG, PNG, or WEBP (Max 5MB)</div>
        </label>
      `;
    }
  }

  function setupFormSubmission() {
    const form = document.getElementById('productForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('prodName').value.trim();
      const sku = document.getElementById('prodSku').value.trim();
      const brand = document.getElementById('prodBrand').value.trim();
      const categoryId = parseInt(document.getElementById('prodCategory').value);
      const subcategoryName = document.getElementById('prodSubcategory').value.trim();
      const price = parseFloat(document.getElementById('prodPrice').value);
      const mrp = parseFloat(document.getElementById('prodMrp').value);
      const stock = parseInt(document.getElementById('prodStock').value) || 0;
      const lowThreshold = parseInt(document.getElementById('prodLowThreshold').value) || 10;
      const unit = document.getElementById('prodUnit').value.trim() || 'piece';
      const weight = document.getElementById('prodWeight').value.trim();
      const emoji = document.getElementById('prodEmoji').value.trim() || '🛒';
      const badge = document.getElementById('prodBadge').value.trim();
      const eta = document.getElementById('prodEta').value.trim() || '10–15 mins';
      const tags = document.getElementById('prodTags').value.trim();
      const shortDesc = document.getElementById('prodShortDesc').value.trim();
      const description = document.getElementById('prodDescription').value.trim();
      const isActive = document.getElementById('prodIsActive').checked;
      const isFeatured = document.getElementById('prodIsFeatured').checked;

      // Validation
      if (!name || !sku || !brand || !categoryId || isNaN(price) || isNaN(mrp)) {
        adminToast('Please fill all required fields correctly.', 'warning');
        return;
      }

      if (price < 0 || mrp < 0) {
        adminToast('Price and MRP cannot be negative.', 'warning');
        return;
      }

      if (mrp < price) {
        adminToast('MRP must be greater than or equal to the selling price.', 'warning');
        return;
      }

      const submitBtn = document.getElementById('btnSubmitProduct');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

      // 1. Upload image if a new local file was selected
      let finalImageUrl = selectedImageUrl;
      if (selectedFile) {
        try {
          adminToast('Uploading product image...', 'info');
          const uploadRes = await AdminAPI.uploadProductImage(selectedFile);
          if (uploadRes && uploadRes.success && uploadRes.data) {
            finalImageUrl = uploadRes.data.image_url;
            selectedImageUrl = finalImageUrl;
            console.log(`[IMAGE] Server upload successful: ${finalImageUrl}`);
          } else {
            console.warn('[IMAGE] Server upload warning:', uploadRes);
            adminToast(uploadRes.error?.message || 'Warning: Image upload failed, continuing product save.', 'warning');
          }
        } catch (upErr) {
          console.error('[IMAGE] Image upload error:', upErr);
        }
      }

      const payload = {
        name,
        sku,
        brand,
        category_id: categoryId,
        subcategory_name: subcategoryName || null,
        price: price.toFixed(2),
        mrp: mrp.toFixed(2),
        stock_quantity: stock,
        low_stock_threshold: lowThreshold,
        unit,
        weight: weight || null,
        emoji,
        badge: badge || null,
        eta,
        tags: tags || null,
        short_description: shortDesc || null,
        description: description || null,
        is_active: isActive,
        is_featured: isFeatured,
        image_url: finalImageUrl || null
      };

      try {
        let res;
        if (editProductId) {
          res = await AdminAPI.updateProduct(editProductId, payload);
        } else {
          res = await AdminAPI.createProduct(payload);
        }

        if (res && res.success) {
          adminToast(`Product ${editProductId ? 'updated' : 'created'} successfully!`, 'success');
          setTimeout(() => {
            window.location.href = 'products.html';
          }, 800);
        } else {
          adminToast(res.error?.message || 'Failed to save product.', 'danger');
          submitBtn.disabled = false;
          submitBtn.innerHTML = editProductId ? '<i class="fas fa-save"></i> Update Product' : '<i class="fas fa-plus"></i> Save Product';
        }
      } catch (err) {
        adminToast(err.message, 'danger');
        submitBtn.disabled = false;
        submitBtn.innerHTML = editProductId ? '<i class="fas fa-save"></i> Update Product' : '<i class="fas fa-plus"></i> Save Product';
      }
    });
  }

  return {
    init,
    removeImage
  };
})();
