import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onActionClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText = 'Start Shopping',
  actionLink = '/products',
  onActionClick,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        {icon || <ShoppingBag className="w-8 h-8 text-brand-red" />}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">{description}</p>
      {actionLink ? (
        <Link to={actionLink} className="btn-primary">
          {actionText}
        </Link>
      ) : onActionClick ? (
        <button type="button" onClick={onActionClick} className="btn-primary">
          {actionText}
        </button>
      ) : null}
    </div>
  );
};
