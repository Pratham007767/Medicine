'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Search, 
  MapPin, 
  Navigation, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Store, 
  Phone, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useGeolocation, PRESET_LOCATIONS } from '@/lib/useGeolocation';
import { InventoryService, calculateDistance } from '@/lib/inventoryService';
import { Pharmacy, InventoryItem } from '@/types';
import StatusBadge from '@/components/common/StatusBadge';
import MedicalDisclaimer from '@/components/common/MedicalDisclaimer';

export default function HomePage() {
  const { location, requestBrowserLocation, setPresetLocation } = useGeolocation();
  const [popularSearches, setPopularSearches] = useState<string[]>([
    'Amoxicillin 500mg',
    'Paracetamol 650mg',
    'Metformin 500mg',
    'Atorvastatin 20mg',
    'Salbutamol Inhaler',
    'Azithromycin 500mg'
  ]);

  const [nearbyPharmacies, setNearbyPharmacies] = useState<{
    pharmacy: Pharmacy;
    distance_km: number;
    inventoryCount: number;
    inStockMedicines: string[];
  }[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadData() {
      const pharmacies = await InventoryService.getPharmacies();
      const inventory = await InventoryService.getInventory();

      // Calculate distance and sample available meds
      const enriched = pharmacies.slice(0, 4).map(pharm => {
        const pharmItems = inventory.filter(i => i.pharmacy_id === pharm.id && (i.status === 'in_stock' || i.status === 'low_stock'));
        const dist = calculateDistance(
          location.latitude,
          location.longitude,
          pharm.latitude,
          pharm.longitude
        );

        return {
          pharmacy: pharm,
          distance_km: dist,
          inventoryCount: pharmItems.length,
          inStockMedicines: pharmItems.slice(0, 3).map(i => `${i.medicine?.name || 'Medicine'} ${i.strength}`)
        };
      });

      // Sort by distance
      enriched.sort((a, b) => a.distance_km - b.distance_km);
      setNearbyPharmacies(enriched);
    }
    loadData();
  }, [location]);

  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-slate-900 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wide shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>SMART MEDICINE AVAILABILITY & PHARMACY LOCATOR</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Find Your Medicine. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-200">
              Without the Search.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            Stop driving from pharmacy to pharmacy. Upload your prescription or search medications instantly to see verified live stock, prices, and shortest routes across nearby medical stores.
          </p>

          {/* TWO MAIN CALL TO ACTIONS */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            <Link
              href="/prescription"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-base transition-all shadow-lg shadow-teal-500/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <FileText className="w-5 h-5 text-navy-950" />
              <span>Upload Prescription</span>
            </Link>

            <Link
              href="/search"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold text-base transition-all backdrop-blur-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <Search className="w-5 h-5 text-teal-300" />
              <span>Search Medicine</span>
            </Link>
          </div>

          {/* QUICK SEARCH BAR IN HERO */}
          <div className="pt-6 max-w-2xl mx-auto">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
                }
              }}
              className="relative flex items-center"
            >
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by brand name or generic (e.g. Amoxicillin, Lipitor, Tylenol)..."
                className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-white text-slate-900 placeholder-slate-400 text-sm shadow-xl focus:outline-none focus:ring-4 focus:ring-teal-500/30 font-medium"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-colors"
              >
                Find Stock
              </button>
            </form>

            {/* Popular quick tags */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-400">
              <span className="text-slate-500 mr-1">Popular:</span>
              {popularSearches.map((item) => (
                <Link
                  key={item}
                  href={`/search?q=${encodeURIComponent(item.split(' ')[0])}`}
                  className="px-2.5 py-1 rounded-lg bg-navy-900/60 hover:bg-navy-800 text-slate-300 hover:text-teal-300 border border-navy-800 text-[11px] transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LOCATION DETECTION PREVIEW BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Search Radius Active</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                Searching near: <span className="text-navy-900 font-bold">{location.cityName}</span>
              </p>
              <p className="text-xs text-slate-500">
                Showing live inventory from 8 registered pharmacies within 10 km
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={requestBrowserLocation}
              disabled={location.loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
            >
              <Navigation className={`w-3.5 h-3.5 text-teal-600 ${location.loading ? 'animate-spin' : ''}`} />
              {location.loading ? 'Detecting GPS...' : 'Detect My Location'}
            </button>
            <Link
              href="/pharmacies"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition-colors"
            >
              <span>View Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {location.error && (
            <div className="w-full text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex flex-wrap items-center justify-between gap-2">
              <span>⚠️ {location.error}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Pick city area:</span>
                <select
                  value={location.cityName}
                  onChange={(e) => {
                    const p = PRESET_LOCATIONS.find(x => x.name === e.target.value);
                    if (p) setPresetLocation(p.name, p.lat, p.lng);
                  }}
                  className="px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  {PRESET_LOCATIONS.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* NEARBY PHARMACY AVAILABILITY PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-navy-900">Nearby Pharmacies & Stock Preview</h2>
            <p className="text-sm text-slate-500">Live inventory status and distance from your detected location</p>
          </div>
          <Link
            href="/pharmacies"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            See all 8 pharmacies <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {nearbyPharmacies.map((item) => (
            <div
              key={item.pharmacy.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-navy-50 text-navy-800 flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                    {item.distance_km} km away
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-1">
                    {item.pharmacy.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {item.pharmacy.address}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Popular In-Stock Items:
                  </span>
                  <div className="space-y-1">
                    {item.inStockMedicines.map((med, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{med}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Open Now
                </span>
                <Link
                  href={`/search?pharmacy_id=${item.pharmacy.id}`}
                  className="font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                >
                  View Inventory →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="bg-white py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Simple 4-Step Process
            </span>
            <h2 className="text-3xl font-extrabold text-navy-900 mt-3">
              How MedFinder Works
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              From prescription slip to confirmed medicine pickup in under two minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 relative">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-navy-950 font-extrabold text-lg flex items-center justify-center shadow-md">
                1
              </div>
              <h3 className="font-bold text-base text-navy-900">Upload or Search</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Take a picture of your prescription (PDF, JPG, PNG) or type generic and brand medicine names directly into the search bar.
              </p>
            </div>

            <div className="space-y-3 relative">
              <div className="w-12 h-12 rounded-2xl bg-navy-900 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                2
              </div>
              <h3 className="font-bold text-base text-navy-900">Instant OCR Extraction</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our smart parser detects medicines, dosage forms, strengths, and quantities. You verify or adjust details before confirming.
              </p>
            </div>

            <div className="space-y-3 relative">
              <div className="w-12 h-12 rounded-2xl bg-navy-900 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                3
              </div>
              <h3 className="font-bold text-base text-navy-900">Multi-Store Stock Matching</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We compare live inventory across all nearby stores to find pharmacies stocking all prescribed items in a single stop.
              </p>
            </div>

            <div className="space-y-3 relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                4
              </div>
              <h3 className="font-bold text-base text-navy-900">Reserve & Pick Up</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Send a 1-click availability enquiry to the pharmacist to hold your medicine, and navigate directly with turn-by-turn map directions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST, SECURITY & MEDICAL SAFETY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MedicalDisclaimer />
      </section>
    </div>
  );
}
