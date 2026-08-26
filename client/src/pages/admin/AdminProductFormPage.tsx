import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Category } from '../../types';
import { apiClient } from '../../api/client';

export const AdminProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [brand, setBrand] = useState('Farm Fresh');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState<number | ''>(50);
  const [mrp, setMrp] = useState<number | ''>(65);
  const [unit, setUnit] = useState('1 kg');
  const [weight, setWeight] = useState('1000g');
  const [stock, setStock] = useState<number | ''>(50);
  const [lowStockThreshold, setLowStockThreshold] = useState<number | ''>(10);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [tags, setTags] = useState('fresh,grocery,staple');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');

  useEffect(() => {
    // Load categories
    apiClient.get('/admin/categories').then((res) => {
      if (res.data.success) {
        setCategories(res.data.data);
        if (!isEditing && res.data.data.length > 0) {
          setCategoryId(res.data.data[0].id);
        }
      }
    });

    // If editing, load product details
    if (isEditing) {
      setIsLoading(true);
      apiClient.get('/admin/products').then((res) => {
        setIsLoading(false);
        if (res.data.success) {
          const prod = res.data.data.find((p: any) => p.id === parseInt(id, 10));
          if (prod) {
            setName(prod.name);
            setSlug(prod.slug);
            setCategoryId(prod.categoryId);
            setBrand(prod.brand);
            setSku(prod.sku);
            setPrice(prod.price);
            setMrp(prod.mrp);
            setUnit(prod.unit);
            setWeight(prod.weight || '');
            setStock(prod.stock);
            setLowStockThreshold(prod.lowStockThreshold);
            setIsFeatured(prod.isFeatured);
            setIsActive(prod.isActive);
            setTags(prod.tags || '');
            setShortDescription(prod.shortDescription || '');
            setDescription(prod.description || '');
            if (prod.mainImage) {
              setExistingImageUrl(prod.mainImage);
              setImagePreview(`/${prod.mainImage}`);
            }
          }
        }
      });
    }
  }, [id, isEditing]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const computedDiscount =
    typeof price === 'number' && typeof mrp === 'number' && mrp > price
      ? Math.round(((mrp - price) / mrp) * 100)
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setErrorMsg('');

      let uploadedPath = existingImageUrl;

      // If user selected a new image file, upload it
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await apiClient.post('/admin/products/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (uploadRes.data.success) {
          uploadedPath = uploadRes.data.data.imageUrl;
        }
      }

      const payload = {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        categoryId: Number(categoryId),
        brand,
        sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
        price: Number(price),
        mrp: Number(mrp),
        discount: computedDiscount,
        unit,
        weight: weight || undefined,
        stock: Number(stock),
        lowStockThreshold: Number(lowStockThreshold),
        isFeatured,
        isActive,
        tags: tags || undefined,
        shortDescription: shortDescription || undefined,
        description: description || undefined,
        mainImage: uploadedPath || 'assets/logo.png',
      };

      if (isEditing) {
        await apiClient.put(`/admin/products/${id}`, payload);
      } else {
        await apiClient.post('/admin/products', payload);
      }

      navigate('/admin/products');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading product information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <Link
          to="/admin/products"
          className="text-xs font-semibold text-slate-600 hover:text-brand-red flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product List</span>
        </Link>
        <h1 className="text-lg font-bold text-slate-900">
          {isEditing ? `Edit Product: ${name}` : 'Add New Grocery Product'}
        </h1>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. FORM */}
      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Basic Details Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Product General Info
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Product Title / Name *</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Amul Pure Desi Ghee (Tin)"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-red focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Product URL Slug</label>
              <input
                required
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. amul-pure-desi-ghee-1l"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Grocery Category *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Brand Name *</label>
              <input
                required
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Amul, Fortune, Aashirvaad, Farm Fresh"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">SKU / Item Code</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. GHE-AML-001"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Pricing, Weight & Stock Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Pricing, Unit & Inventory
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Selling Price (₹) *</label>
              <input
                required
                type="number"
                step="0.5"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">MRP Price (₹) *</label>
              <input
                required
                type="number"
                step="0.5"
                value={mrp}
                onChange={(e) => setMrp(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Discount (% OFF)</label>
              <div className="p-2.5 bg-slate-100 rounded-lg font-bold text-brand-red text-center">
                {computedDiscount}% OFF
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Pack Unit (e.g. 1 kg) *</label>
              <input
                required
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="1 kg, 500 g, 1 L"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Net Weight (g/ml)</label>
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="1000g, 500ml"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Current Stock Quantity *</label>
              <input
                required
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Low Stock Alert Level</label>
              <input
                required
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex flex-col justify-center space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-brand-red focus:ring-brand-red"
                />
                <span className="font-semibold text-slate-800">★ Best Seller Shelf</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-800">✓ Active on Storefront</span>
              </label>
            </div>
          </div>
        </div>

        {/* Product Image Uploader Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Product Media
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Image Preview */}
            <div className="w-32 h-32 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center p-2 overflow-hidden shrink-0">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                  <span className="text-[10px]">No image</span>
                </div>
              )}
            </div>

            {/* File input button */}
            <div className="space-y-2 flex-1">
              <label
                htmlFor="admin-product-image"
                className="btn-secondary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-brand-red" />
                <span>Choose Product Photo</span>
              </label>
              <input
                id="admin-product-image"
                name="productImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelect}
                className="sr-only"
              />
              <p className="text-[11px] text-slate-400">
                Supports JPEG, PNG, WebP (Max 5MB). Photo preview appears immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Descriptions & Tags */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Descriptions & Keywords
          </h3>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Short Tagline Summary</label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="e.g. Farm-fresh organic apples packed with sweetness and vitamins."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Detailed Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Full culinary and health description, cooking ideas, storage advice..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Search Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. atta, roti, chakki, sharbati, wheat"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to="/admin/products" className="btn-secondary !py-2.5 !px-5 text-xs font-bold">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary !py-2.5 !px-6 text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Product...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditing ? 'Update Product' : 'Save & Publish Product'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
