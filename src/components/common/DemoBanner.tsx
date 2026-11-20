'use client';

import React from 'react';
import { useAuth } from '@/lib/authContext';
import { Sparkles, ShieldAlert, User, Store, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function DemoBanner() {
  const { user, switchRole, isPharmacyOwner } = useAuth();

  return (
    <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-950 text-white text-xs border-b border-navy-700/60 py-2 px-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-400/30 text-[11px] tracking-wide">
            <Sparkles className="w-3 h-3 text-amber-400" />
            DEMO PROTOTYPE
          </span>
          <span className="text-slate-300 hidden md:inline">
            Simulated pharmacy inventory & live distance calculation.
          </span>
        </div>

        {/* User Role Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 hidden sm:inline">Active Role:</span>
          <div className="inline-flex rounded-lg bg-navy-950 p-0.5 border border-navy-700">
            <button
              onClick={() => switchRole('patient')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                !isPharmacyOwner
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3 h-3" />
              Patient View
            </button>
            <button
              onClick={() => switchRole('pharmacy_owner')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                isPharmacyOwner
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Store className="w-3 h-3" />
              Pharmacy Owner
            </button>
          </div>

          {isPharmacyOwner ? (
            <Link
              href="/pharmacy-dashboard"
              className="text-teal-300 hover:text-teal-200 underline font-medium ml-1 hidden sm:inline"
            >
              Go to Dashboard →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
