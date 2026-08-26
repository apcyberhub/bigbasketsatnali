import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Check, X, Filter } from 'lucide-react';
import { Product, Category } from '../../types';
import { apiClient } from '../../api/client';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);
      params.set('limit', '100');

      const [prodRes, catRes] = await Promise.all([
        apiClient.get(`/admin/products?${params.toString()}`),
        apiClient.get('/admin/categories'),
      ]);

      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch (err) {
      console.error('Failed to load admin products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete product: "${name}"?`)) return;
    try {
      const res = await apiClient.delete(`/admin/products/${id}`);
      if (res.data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Grocery Products Management</h1>
          <p className="text-xs text-slate-500">
            {products.length} products listed in store catalog
          </p>
        </div>

        <Link
          to="/admin/products/new"
          className="btn-primary !py-2 !px-4 text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* 2. SEARCH & CATEGORY FILTER */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchProducts();
          }}
          className="relative w-full sm:max-w-md"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, brand, SKU..."
            className="w-full pl-9 pr-20 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-red focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-800 text-white rounded text-[11px] font-semibold"
          >
            Search
          </button>
        </form>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-red"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* 3. PRODUCT TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Item</th>
              <th className="py-3 px-4">Brand & Category</th>
              <th className="py-3 px-4">Price / MRP</th>
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4">Featured</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                  Loading product catalog...
                </td>
              </tr>
            ) : products.length > 0 ? (
              products.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Image & Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.mainImage ? `/${prod.mainImage}` : '/assets/logo.png'}
                        alt={prod.name}
                        className="w-10 h-10 object-contain rounded bg-slate-50 border border-slate-100 p-1 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/logo.png';
                        }}
                      />
                      <div>
                        <span className="font-semibold text-slate-900 line-clamp-1 block">{prod.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</span>
                      </div>
                    </div>
                  </td>

                  {/* Brand & Category */}
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800 block">{prod.brand}</span>
                    <span className="text-[10px] text-slate-400">{prod.category?.name || 'General'}</span>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">₹{prod.price}</span>
                    <span className="text-[10px] text-slate-400">MRP ₹{prod.mrp} ({prod.unit})</span>
                  </td>

                  {/* Stock */}
                  <td className="py-3 px-4">
                    <span
                      className={`font-bold ${
                        prod.stock <= prod.lowStockThreshold ? 'text-rose-600' : 'text-slate-700'
                      }`}
                    >
                      {prod.stock} units
                    </span>
                  </td>

                  {/* Featured */}
                  <td className="py-3 px-4">
                    {prod.isFeatured ? (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        ★ Featured
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        prod.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {prod.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/products/${prod.id}/edit`}
                        className="p-1.5 text-slate-600 hover:text-brand-red hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                  No products found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
