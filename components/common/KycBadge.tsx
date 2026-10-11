import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { KycStatus } from '@/types';

interface KycBadgeProps {
  status: KycStatus;
  size?: 'sm' | 'md' | 'lg';
}

export default function KycBadge({ status, size = 'md' }: KycBadgeProps) {
  const configs = {
    APPROVED: {
      label: 'Verified Volunteer',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      dot: 'bg-emerald-500',
    },
    PENDING_KYC: {
      label: 'KYC Pending Review',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
      dot: 'bg-amber-500',
    },
    REJECTED: {
      label: 'KYC Rejected',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: XCircle,
      dot: 'bg-rose-500',
    },
    SUSPENDED: {
      label: 'Account Suspended',
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: AlertTriangle,
      dot: 'bg-slate-500',
    },
  };

  const config = configs[status] || configs.PENDING_KYC;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses[size]} transition-all`}
    >
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      {config.label}
    </span>
  );
}
