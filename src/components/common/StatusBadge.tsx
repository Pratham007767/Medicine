import React from 'react';
import { AvailabilityStatus } from '@/types';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ShieldCheck, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: AvailabilityStatus;
  quantity?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  verifiedAt?: string;
  verifiedBy?: string;
  isRecent?: boolean;
}

export default function StatusBadge({
  status,
  quantity,
  showIcon = true,
  size = 'md',
  verifiedAt,
  verifiedBy,
  isRecent = true
}: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  // If status is in_stock or low_stock but NOT recently verified, automatically present as unconfirmed
  const effectiveStatus: AvailabilityStatus = (!isRecent && status !== 'out_of_stock') 
    ? 'unconfirmed' 
    : status;

  return (
    <div className="inline-flex flex-col items-start gap-1">
      {effectiveStatus === 'in_stock' && (
        <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-sm ${sizeClasses[size]}`}>
          {showIcon && <CheckCircle2 className={`${iconSizes[size]} text-emerald-600 flex-shrink-0`} />}
          <span>In Stock {quantity !== undefined ? `(${quantity} units)` : ''}</span>
        </span>
      )}

      {effectiveStatus === 'low_stock' && (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200/90 shadow-sm ${sizeClasses[size]}`}>
          {showIcon && <AlertTriangle className={`${iconSizes[size]} text-amber-600 flex-shrink-0`} />}
          <span>Low Stock {quantity !== undefined ? `(${quantity} units)` : ''}</span>
        </span>
      )}

      {effectiveStatus === 'out_of_stock' && (
        <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200/90 shadow-sm ${sizeClasses[size]}`}>
          {showIcon && <XCircle className={`${iconSizes[size]} text-rose-600 flex-shrink-0`} />}
          <span>Out of Stock</span>
        </span>
      )}

      {effectiveStatus === 'unconfirmed' && (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-300 shadow-sm ${sizeClasses[size]}`}>
          {showIcon && <HelpCircle className={`${iconSizes[size]} text-slate-500 flex-shrink-0`} />}
          <span>Availability Unconfirmed</span>
        </span>
      )}

      {/* Stock Verification Timestamp Display */}
      {verifiedAt && (
        <div className="flex items-center gap-1 text-[10px] text-slate-500 pl-0.5">
          {effectiveStatus === 'in_stock' || effectiveStatus === 'low_stock' ? (
            <>
              <ShieldCheck className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              <span>Verified: <strong>{verifiedAt}</strong></span>
            </>
          ) : effectiveStatus === 'unconfirmed' ? (
            <>
              <Clock className="w-3 h-3 text-amber-500 flex-shrink-0" />
              <span className="text-amber-700 font-medium">Last confirmed: {verifiedAt} (Call to verify)</span>
            </>
          ) : (
            <>
              <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span>Checked: {verifiedAt}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
