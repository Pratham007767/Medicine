'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Navigation, 
  Store, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Search, 
  Compass, 
  ShieldCheck, 
  ExternalLink,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { InventoryService, calculateDistance } from '@/lib/inventoryService';
import { useGeolocation, PRESET_LOCATIONS } from '@/lib/useGeolocation';
import { Pharmacy, InventoryItem } from '@/types';
import PharmacyMapWrapper from '@/components/map/PharmacyMapWrapper';

export default function PharmacyLocatorPage() {
  const { location, requestBrowserLocation, setPresetLocation } = useGeolocation();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | undefined>(undefined);
  const [filterQuery, setFilterQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [pharms, invs] = await Promise.all([
        InventoryService.getPharmacies(),
        InventoryService.getInventory()
      ]);
      setPharmacies(pharms);
      setInventory(invs);
      setLoading(false);
    }
    loadData();
  }, []);

  // Compute enriched pharmacies with distance and inventory statistics
  const enrichedPharmacies = pharmacies.map(pharm => {
    const pharmInventory = inventory.filter(i => i.pharmacy_id === pharm.id);
    const inStockCount = pharmInventory.filter(i => i.status === 'in_stock' || i.status === 'low_stock').length;
    const distance_km = calculateDistance(
      location.latitude,
      location.longitude,
      pharm.latitude,
      pharm.longitude
    );

    return {
      pharmacy: pharm,
      inStockCount,
      distance_km,
      inventory: pharmInventory
    };
  })
  .filter(p => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return p.pharmacy.name.toLowerCase().includes(q) || p.pharmacy.address.toLowerCase().includes(q);
  })
  .sort((a, b) => a.distance_km - b.distance_km);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Location Selection */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900">
              Nearby Pharmacy Finder
            </h1>
            <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-teal-200">
              {enrichedPharmacies.length} Stores Available
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Displaying licensed pharmacies sorted by proximity to: <strong className="text-navy-900">{location.cityName}</strong>
          </p>
        </div>

        {/* Location Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={requestBrowserLocation}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Use GPS Location</span>
          </button>

          <select
            value={location.cityName}
            onChange={(e) => {
              const preset = PRESET_LOCATIONS.find(p => p.name === e.target.value);
              if (preset) {
                setPresetLocation(preset.name, preset.lat, preset.lng);
              }
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-slate-50 text-slate-700"
          >
            {PRESET_LOCATIONS.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: List on Left, Interactive Map on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Pharmacy Cards List */}
        <div className="lg:col-span-5 space-y-3 order-2 lg:order-1">
          {/* Quick Filter */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter pharmacies by name or street..."
              className="w-full pl-10 pr-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>

          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {enrichedPharmacies.map(({ pharmacy, inStockCount, distance_km }) => {
              const isSelected = selectedPharmacyId === pharmacy.id;

              return (
                <div
                  key={pharmacy.id}
                  onClick={() => setSelectedPharmacyId(pharmacy.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/40 shadow-md ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-teal-600 flex-shrink-0" />
                        <h3 className="font-bold text-sm text-navy-900 leading-snug">
                          {pharmacy.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500">{pharmacy.address}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-navy-900 text-white font-bold text-xs shadow-sm">
                        {distance_km} km
                      </span>
                      <span className="text-[11px] text-amber-500 font-semibold block mt-1">
                        ★ {pharmacy.rating}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{pharmacy.opening_hours.split(',')[0]}</span>
                    </div>
                    <span className="text-emerald-700 font-semibold text-[11px]">
                      {inStockCount} medicines in stock
                    </span>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <a
                      href={`tel:${pharmacy.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-teal-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {pharmacy.phone}
                    </a>

                    <div className="flex items-center gap-3">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-600 hover:text-navy-900 font-medium flex items-center gap-1"
                      >
                        Directions <ExternalLink className="w-3 h-3" />
                      </a>
                      <Link
                        href={`/search?pharmacy_id=${pharmacy.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-navy-900 hover:text-teal-600"
                      >
                        Browse Stock →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map View on Right */}
        <div className="lg:col-span-7 order-1 lg:order-2 sticky top-24">
          <PharmacyMapWrapper
            userLocation={{
              latitude: location.latitude,
              longitude: location.longitude,
              cityName: location.cityName
            }}
            pharmacies={enrichedPharmacies.map(p => ({
              pharmacy: p.pharmacy,
              distance_km: p.distance_km,
              status: 'in_stock'
            }))}
            selectedPharmacyId={selectedPharmacyId}
            onSelectPharmacy={(id) => setSelectedPharmacyId(id)}
            height="620px"
          />
        </div>
      </div>
    </div>
  );
}
