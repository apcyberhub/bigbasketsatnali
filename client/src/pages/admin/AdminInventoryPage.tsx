import React, { useState, useEffect } from 'react';
import { Boxes, AlertTriangle, CheckCircle2, Search, RefreshCw, Save } from 'lucide-react';
import { Product } from '../../types';
import { apiClient } from '../../api/client';

export const AdminInventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [stockInputs, setStockInputs] = useState<{ [id: number]: number }>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/admin/inventory');
      if (res.data.success) {
        setProducts(res.data.data);
        const initialMap: { [id: number]: number } = {};
        res.data.data.forEach((p: Product) => {
          initialMap[p.id] = p.stock;
        });
        setStockInputs(initialMap);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleStockSave = async (productId: number) => {
    try {
      setSavingId(productId);
      const newStock = stockInputs[productId];
      const res = await apiClient.patch(`/admin/inventory/${productId}/stock`, {
        stock: Number(newStock),
      });
      if (res.data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock: Number(newStock) } : p))
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setSavingId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLow = showLowStockOnly ? p.stock <= p.lowStockThreshold : true;
    return matchesSearch && matchesLow;
  });

  const lowStockTotal = products.filter((p) => p.stock <= p.lowStockThreshold).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Inventory & Stock Control</h1>
          <p className="text-xs text-slate-500">
            Real-time stock counts and low threshold reorder alerts
          </p>
        </div>

        <button
          type="button"
          onClick={fetchInventory}
          className="btn-secondary !py-1.5 !px-3 text-xs font-semibold flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Filter & Alert Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name, brand, SKU..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <button
          type="button"
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
            showLowStockOnly
              ? 'bg-rose-600 text-white'
              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Show Low Stock Only ({lowStockTotal})</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Item</th>
              <th className="py-3 px-4">Brand</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Stock Level Status</th>
              <th className="py-3 px-4">Update Quantity</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                  Loading inventory counts...
                </td>
              </tr>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((prod) => {
                const isLow = prod.stock <= prod.lowStockThreshold;
                const isOut = prod.stock === 0;
                return (
                  <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
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
                          <span className="font-semibold text-slate-900 line-clamp-1 block">
                            {prod.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            SKU: {prod.sku} • {prod.unit}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-700">{prod.brand}</td>
                    <td className="py-3 px-4 text-slate-500">{prod.category?.name}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{prod.price}</td>

                    <td className="py-3 px-4">
                      {isOut ? (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          Out of Stock (0)
                        </span>
                      ) : isLow ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase animate-pulse">
                          Low Stock ({prod.stock} / {prod.lowStockThreshold})
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Healthy ({prod.stock})
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        value={stockInputs[prod.id] !== undefined ? stockInputs[prod.id] : prod.stock}
                        onChange={(e) =>
                          setStockInputs({ ...stockInputs, [prod.id]: Number(e.target.value) })
                        }
                        className="w-20 p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-center focus:bg-white focus:ring-2 focus:ring-brand-red focus:outline-none"
                      />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleStockSave(prod.id)}
                        disabled={savingId === prod.id}
                        className="btn-primary !py-1 !px-3 text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        <span>{savingId === prod.id ? 'Saving...' : 'Update'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                  No inventory records match your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
