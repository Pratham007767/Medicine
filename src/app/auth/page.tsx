'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { 
  User, 
  Store, 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2,
  FileCheck,
  Loader2
} from 'lucide-react';

import { InventoryService } from '@/lib/inventoryService';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'pharmacy_owner' ? 'pharmacy_owner' : 'patient';

  const { login } = useAuth();

  const [role, setRole] = useState<'patient' | 'pharmacy_owner'>(initialRole);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      if (role === 'pharmacy_owner') {
        if (isSignUp) {
          // Register new pharmacy as unverified pending state board check
          const created = await InventoryService.registerPharmacy({
            name: pharmacyName || `${fullName || 'Independent'}'s Pharmacy`,
            license_number: licenseNumber || `PH-NY-${Math.floor(10000 + Math.random() * 90000)}`,
            owner_name: fullName || 'Pharmacist',
            email: email.trim(),
            phone: '+91 361 257 0100',
            address: 'Jalukbari Chariali, Near Gauhati University',
            city: 'Guwahati',
            state: 'Assam',
            postal_code: '781014',
            latitude: 26.1510,
            longitude: 91.6635,
            opening_hours: 'Mon-Sat: 8:00 AM - 9:30 PM'
          }, false); // verified = false: cannot publish stock until state board verification

          login(email, 'pharmacy_owner', fullName || pharmacyName, created.id);
          router.push('/pharmacy-dashboard');
        } else {
          // Look up existing pharmacy
          const pharms = await InventoryService.getPharmacies();
          const matched = pharms.find(p => p.email.toLowerCase() === email.trim().toLowerCase());
          const pharmId = matched ? matched.id : 'pharm-1';
          login(email, 'pharmacy_owner', matched?.owner_name || fullName || 'Pharmacy Manager', pharmId);
          router.push('/pharmacy-dashboard');
        }
      } else {
        login(email, 'patient', fullName || 'Verified Patient');
        router.push('/search');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoPatient = () => {
    login('alex.morgan@example.com', 'patient', 'Alex Morgan');
    router.push('/search');
  };

  const handleQuickDemoVerifiedPharmacy = () => {
    login('evelyn@careplusmetro.com', 'pharmacy_owner', 'Dr. Evelyn Reed, PharmD', 'pharm-1');
    router.push('/pharmacy-dashboard');
  };

  const handleQuickDemoUnverifiedPharmacy = () => {
    login('arthur@newtowndispensary.com', 'pharmacy_owner', 'Dr. Arthur Pendelton, RPh', 'pharm-9');
    router.push('/pharmacy-dashboard');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      {/* Role Selection Tabs */}
      <div className="bg-slate-100 p-1 rounded-2xl flex border border-slate-200">
        <button
          type="button"
          onClick={() => setRole('patient')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            role === 'patient'
              ? 'bg-white text-navy-900 shadow-sm'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          <User className="w-4 h-4 text-teal-600" />
          Patient Portal
        </button>
        <button
          type="button"
          onClick={() => setRole('pharmacy_owner')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            role === 'pharmacy_owner'
              ? 'bg-white text-navy-900 shadow-sm'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          <Store className="w-4 h-4 text-teal-600" />
          Pharmacy Owner
        </button>
      </div>

      {/* Main Auth Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-extrabold text-navy-900">
            {isSignUp
              ? role === 'pharmacy_owner' ? 'Register Pharmacy' : 'Create Patient Account'
              : role === 'pharmacy_owner' ? 'Pharmacy Sign In' : 'Patient Sign In'}
          </h2>
          <p className="text-xs text-slate-500">
            {role === 'pharmacy_owner'
              ? 'Manage live inventory, update medicine prices, and receive reservations'
              : 'Find medicines, track prescription history, and reserve stock nearby'}
          </p>
        </div>

        {/* 1-Click Fast Demo Login Buttons */}
        <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-center">
            Instant 1-Click Demo Login
          </span>
          {role === 'patient' ? (
            <button
              onClick={handleQuickDemoPatient}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Sign in as Demo Patient (Alex Morgan)
            </button>
          ) : (
            <div className="space-y-1.5">
              <button
                onClick={handleQuickDemoVerifiedPharmacy}
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-navy-50 hover:bg-navy-100 text-navy-900 text-xs font-semibold border border-navy-200 transition-colors"
              >
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Pharmacy (CarePlus - Dr. Reed)</span>
              </button>
              <button
                onClick={handleQuickDemoUnverifiedPharmacy}
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-200 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Unverified Pharmacy (NewTown - Pending Review)</span>
              </button>
            </div>
          )}
        </div>

        <div className="relative flex items-center justify-center">
          <span className="absolute inset-x-0 h-px bg-slate-200"></span>
          <span className="relative bg-white px-3 text-xs text-slate-400 font-medium uppercase">
            or use credentials
          </span>
        </div>

        {/* Standard Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isSignUp && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {isSignUp && role === 'pharmacy_owner' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pharmacy Business Name</label>
                <input
                  type="text"
                  required
                  value={pharmacyName}
                  onChange={(e) => setPharmacyName(e.target.value)}
                  placeholder="e.g. CarePlus Metro Pharmacy"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Government Pharmacy License #</label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. PH-NY-98120"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-2 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-teal-600 hover:underline font-semibold"
          >
            {isSignUp ? 'Already registered? Sign in here' : "Don't have an account? Register now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}

