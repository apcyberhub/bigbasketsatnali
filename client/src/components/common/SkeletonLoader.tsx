import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="card p-4 animate-pulse">
      <div className="aspect-square bg-slate-200 rounded-lg mb-3" />
      <div className="h-3 bg-slate-200 rounded w-1/3 mb-2" />
      <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-slate-200 rounded w-1/4 mb-4" />
      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
        <div className="h-5 bg-slate-200 rounded w-16" />
        <div className="h-8 bg-slate-200 rounded-lg w-20" />
      </div>
    </div>
  );
};

export const BannerSkeleton: React.FC = () => {
  return (
    <div className="w-full h-48 sm:h-72 lg:h-96 bg-slate-200 rounded-2xl animate-pulse" />
  );
};

export const CategoryPillSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-2 animate-pulse">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 rounded-full" />
      <div className="w-14 h-3 bg-slate-200 rounded" />
    </div>
  );
};
