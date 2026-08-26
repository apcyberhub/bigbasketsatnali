import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (slug) {
      navigate(`/products?category=${slug}`, { replace: true });
    }
  }, [slug, navigate]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 text-center">
      <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-2" />
      <p className="text-xs text-slate-500">Loading category products...</p>
    </div>
  );
};
