import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, XCircle, Trash2, MessageSquare } from 'lucide-react';
import { Review } from '../../types';
import { apiClient } from '../../api/client';

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/admin/reviews');
      if (res.data.success) {
        setReviews(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleApproval = async (id: number) => {
    try {
      const res = await apiClient.patch(`/admin/reviews/${id}/moderation`);
      if (res.data.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isApproved: !r.isApproved } : r))
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update review status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently delete this customer review?')) return;
    try {
      const res = await apiClient.delete(`/admin/reviews/${id}`);
      if (res.data.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete review');
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-900">Customer Review Moderation</h1>
        <p className="text-xs text-slate-500">
          Moderate customer product feedback, star ratings, and verified purchases
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Rating</th>
              <th className="py-3 px-4">Review Comment</th>
              <th className="py-3 px-4">Verified</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                  Loading reviews...
                </td>
              </tr>
            ) : reviews.length > 0 ? (
              reviews.map((rev) => (
                <tr key={rev.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {rev.product?.name || `Product #${rev.productId}`}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {rev.user?.name || 'Customer'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{rev.rating}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    {rev.comment}
                  </td>
                  <td className="py-3 px-4">
                    {rev.isVerifiedPurchase ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Unverified</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleApproval(rev.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        rev.isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rev.isApproved ? 'Approved' : 'Pending Review'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(rev.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Delete Review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                  No customer reviews found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
