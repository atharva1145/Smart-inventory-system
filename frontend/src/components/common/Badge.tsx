import React from 'react';
import { OrderStatus, PurchaseOrderStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'gray';
  status?: OrderStatus | PurchaseOrderStatus | string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  size = 'md',
}) => {
  let badgeVariant = variant || 'default';

  if (status) {
    switch (status) {
      case 'DELIVERED':
      case 'RECEIVED':
      case 'ACTIVE':
      case 'PAID':
        badgeVariant = 'success';
        break;
      case 'CONFIRMED':
      case 'APPROVED':
      case 'PROCESSING':
        badgeVariant = 'info';
        break;
      case 'PENDING':
      case 'PARTIALLY_RECEIVED':
      case 'DRAFT':
        badgeVariant = 'warning';
        break;
      case 'CANCELLED':
      case 'INACTIVE':
      case 'OUT_OF_STOCK':
      case 'REFUNDED':
        badgeVariant = 'danger';
        break;
      case 'LOW_STOCK':
        badgeVariant = 'purple';
        break;
      default:
        badgeVariant = 'gray';
    }
  }

  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    gray: 'bg-slate-100 text-slate-600 border-slate-200',
  }[badgeVariant];

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantClasses} ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {children || status}
    </span>
  );
};
