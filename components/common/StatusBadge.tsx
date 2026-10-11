import React from 'react';
import { RequestStatus } from '@/types';
import { Clock, Radio, UserCheck, Play, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: RequestStatus | string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const configs: Record<string, { label: string; bg: string; icon: any }> = {
    PENDING: {
      label: 'Pending',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
    },
    MATCHING: {
      label: 'Matching Nearby...',
      bg: 'bg-teal-50 text-teal-700 border-teal-200 animate-pulse',
      icon: Radio,
    },
    ASSIGNED: {
      label: 'Volunteer Assigned',
      bg: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: UserCheck,
    },
    ACTIVE: {
      label: 'In Progress / Active',
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: Play,
    },
    COMPLETION_PENDING: {
      label: 'Awaiting Code Confirmation',
      bg: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
      icon: AlertCircle,
    },
    COMPLETED: {
      label: 'Completed ✓',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle,
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: XCircle,
    },
    EXPIRED: {
      label: 'Expired',
      bg: 'bg-rose-50 text-rose-600 border-rose-200',
      icon: XCircle,
    },
  };

  const config = configs[status] || {
    label: status,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Clock,
  };
  const Icon = config.icon;

  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.bg} ${sizeClass}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
