import React from 'react';
import Link from 'next/link';
import { Cross, ShieldCheck, Heart, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-white border-t border-navy-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                <Cross className="w-5 h-5 fill-teal-400 stroke-teal-400" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Med<span className="text-teal-400">Finder</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Smart medicine availability and real-time pharmacy locator. Helping patients locate essential medicines without endless physical trips.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Pharmacy Network</span>
            </div>
          </div>

          {/* Patient Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-3">
              For Patients
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/search" className="hover:text-teal-300 transition-colors">
                  Search Medicine Catalog
                </Link>
              </li>
              <li>
                <Link href="/prescription" className="hover:text-teal-300 transition-colors">
                  Upload & Scan Prescription
                </Link>
              </li>
              <li>
                <Link href="/pharmacies" className="hover:text-teal-300 transition-colors">
                  Nearby Pharmacy Map
                </Link>
              </li>
              <li>
                <Link href="/results" className="hover:text-teal-300 transition-colors">
                  Multi-Medicine Basket Finder
                </Link>
              </li>
            </ul>
          </div>

          {/* Pharmacy Owners */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-3">
              For Pharmacies
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/pharmacy-dashboard" className="hover:text-teal-300 transition-colors">
                  Owner Dashboard
                </Link>
              </li>
              <li>
                <Link href="/pharmacy-dashboard" className="hover:text-teal-300 transition-colors">
                  Inventory Management
                </Link>
              </li>
              <li>
                <Link href="/pharmacy-dashboard" className="hover:text-teal-300 transition-colors">
                  Stock Availability Enquiries
                </Link>
              </li>
              <li>
                <Link href="/auth?role=pharmacy_owner" className="hover:text-teal-300 transition-colors">
                  Register Your Pharmacy
                </Link>
              </li>
            </ul>
          </div>

          {/* Safety & Compliance */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-3">
              Safety & Compliance
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              MedFinder operates strictly as an information directory connecting patients to licensed dispensers. We do not sell pharmaceuticals directly.
            </p>
            <div className="p-2.5 rounded-xl bg-navy-900 border border-navy-800 text-[11px] text-slate-400">
              <span className="text-amber-400 font-semibold">Important:</span> In case of a medical emergency, immediately dial 911 or visit the nearest emergency room.
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 mt-8 border-t border-navy-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} MedFinder Healthcare Technologies. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built with modern health-tech standards</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
}
