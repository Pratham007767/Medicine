'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Store, 
  Phone, 
  Clock, 
  DollarSign, 
  Check, 
  Sparkles, 
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Map as MapIcon,
  List as ListIcon,
  Send,
  HelpCircle,
  AlertTriangle,
  Loader2,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  X,
  ExternalLink,
  Info
} from 'lucide-react';
import { InventoryService } from '@/lib/inventoryService';
import { useGeolocation } from '@/lib/useGeolocation';
import { 
  Medicine, 
  Pharmacy, 
  InventoryItem, 
  DosageForm, 
  AvailabilityStatus,
  SearchQueryItem,
  SearchSortOption,
  PharmacySearchResult 
} from '@/types';
import { 
  searchMedicinesCatalog, 
  parseSearchQuery, 
  searchPharmaciesForMedicines, 
  isStockRecentlyVerified 
} from '@/lib/searchEngine';
import StatusBadge from '@/components/common/StatusBadge';
import PharmacyMapWrapper from '@/components/map/PharmacyMapWrapper';
import EnquiryModal from '@/components/common/EnquiryModal';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialPharmId = searchParams.get('pharmacy_id') || '';

  const { location, requestBrowserLocation } = useGeolocation();

  // Master Data
  const [allMedicines, setAllMedicines] = useState<Medicine[]>([]);
  const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
  const [allPharmacies, setAllPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);

  // Search Input & Suggestions
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Active Multi-Medicine Search Items Basket
  const [queryBasket, setQueryBasket] = useState<SearchQueryItem[]>([]);

  // Filters & Sorting
  const [selectedForm, setSelectedForm] = useState<string>('all');
  const [selectedStrength, setSelectedStrength] = useState<string>('all');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(20);
  const [sortBy, setSortBy] = useState<SearchSortOption>('nearest');
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Reservation Enquiry Modal State
  const [enquiryPharmacy, setEnquiryPharmacy] = useState<Pharmacy | null>(null);
  const [enquiryItems, setEnquiryItems] = useState<{ medicine_name: string; strength: string; quantity: number }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch initial master data
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [meds, pharms, invs] = await Promise.all([
        InventoryService.getMedicines(),
        InventoryService.getPharmacies(),
        InventoryService.getInventory()
      ]);
      setAllMedicines(meds);
      setAllPharmacies(pharms);
      setAllInventory(invs);

      // Initialize with query param or default popular medicine
      if (initialQuery) {
        const parsed = parseSearchQuery(initialQuery);
        const matches = searchMedicinesCatalog(parsed.cleanName || initialQuery, meds, 0.4);
        const bestMed = matches[0]?.medicine || meds[0];
        setQueryBasket([{
          id: `query-0`,
          name: bestMed.name,
          matched_medicine_id: bestMed.id,
          strength: parsed.detectedStrength || bestMed.strengths[0] || '500mg',
          dosage_form: parsed.detectedForm || bestMed.dosage_form || 'Tablet',
          quantity: 1
        }]);
      } else {
        // Default popular initial item
        const defaultMed = meds[0]; // Amoxicillin
        setQueryBasket([{
          id: `query-0`,
          name: defaultMed.name,
          matched_medicine_id: defaultMed.id,
          strength: '500mg',
          dosage_form: 'Capsule',
          quantity: 1
        }]);
      }

      setLoading(false);
    }
    load();
  }, [initialQuery]);

  // Live Auto-Complete Suggestions with Fuzzy Matching & Spelling Variations
  const suggestions = useMemo(() => {
    if (!searchInput.trim() || allMedicines.length === 0) return [];
    return searchMedicinesCatalog(searchInput, allMedicines, 0.45).slice(0, 5);
  }, [searchInput, allMedicines]);

  // Add Medicine to Search Basket
  const handleSelectMedicine = (med: Medicine, strength?: string, form?: DosageForm) => {
    const newItem: SearchQueryItem = {
      id: `query-${Date.now()}`,
      name: med.name,
      matched_medicine_id: med.id,
      strength: strength || med.strengths[0] || '500mg',
      dosage_form: form || med.dosage_form || 'Tablet',
      quantity: 1
    };

    // Avoid duplicate additions
    const exists = queryBasket.some(
      q => q.name.toLowerCase() === med.name.toLowerCase() && q.strength === newItem.strength
    );

    if (!exists) {
      setQueryBasket(prev => [...prev, newItem]);
    }
    setSearchInput('');
    setShowSuggestions(false);
  };

  // Remove medicine from basket
  const handleRemoveFromBasket = (id?: string) => {
    setQueryBasket(prev => prev.filter(item => item.id !== id));
  };

  // Update Strength in Basket (Exact match requirement - user controls prescribed strength)
  const handleUpdateBasketStrength = (id: string | undefined, strength: string) => {
    setQueryBasket(prev => prev.map(item => item.id === id ? { ...item, strength } : item));
  };

  // Execute Search & Match Engine
  const searchResults = useMemo(() => {
    if (queryBasket.length === 0 || allPharmacies.length === 0) {
      return { allPharmacies: [], completeMatches: [], partialMatches: [] };
    }

    // Filter pharmacies by initial pharmacy if requested
    let targetPharmacies = allPharmacies;
    if (initialPharmId) {
      targetPharmacies = targetPharmacies.filter(p => p.id === initialPharmId);
    }

    // Run core matching algorithm
    const evaluation = searchPharmaciesForMedicines(
      queryBasket,
      targetPharmacies,
      allInventory,
      allMedicines,
      { latitude: location.latitude, longitude: location.longitude },
      sortBy
    );

    // Apply distance & stock filters
    const filterFn = (res: PharmacySearchResult) => {
      if (res.distance_km > maxDistanceKm) return false;
      if (inStockOnly && res.available_count === 0) return false;
      return true;
    };

    return {
      allPharmacies: evaluation.allPharmacies.filter(filterFn),
      completeMatches: evaluation.completeMatches.filter(filterFn),
      partialMatches: evaluation.partialMatches.filter(filterFn)
    };
  }, [
    queryBasket,
    allPharmacies,
    allInventory,
    allMedicines,
    location,
    sortBy,
    maxDistanceKm,
    inStockOnly,
    initialPharmId
  ]);

  // Open Enquiry modal for a pharmacy
  const handleOpenReservation = (pharmacy: Pharmacy, items: PharmacySearchResult['matched_items']) => {
    setEnquiryPharmacy(pharmacy);
    setEnquiryItems(
      items.map(m => ({
        medicine_name: m.queryItem.name,
        strength: m.queryItem.strength,
        quantity: m.queryItem.quantity || 1
      }))
    );
    setIsModalOpen(true);
  };

  // Map markers payload
  const mapMarkers = useMemo(() => {
    return searchResults.allPharmacies.map(r => ({
      pharmacy: r.pharmacy,
      distance_km: r.distance_km,
      status: r.has_all_medicines 
        ? ('in_stock' as AvailabilityStatus) 
        : (r.available_count > 0 ? ('low_stock' as AvailabilityStatus) : ('out_of_stock' as AvailabilityStatus)),
      medicineName: queryBasket.map(q => q.name).join(', '),
      price: r.total_price
    }));
  }, [searchResults, queryBasket]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Search Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Live Stock Engine
              </span>
              <span className="text-xs text-slate-400">• Verified Recently Only</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-2">
              Search Prescribed Medicines & Nearby Stock
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Search by <strong>Brand Name</strong> or <strong>Active Ingredient / Generic Name</strong>. Supports typos, spelling variations, and multi-medicine basket comparisons.
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                viewMode === 'split' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Split View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                viewMode === 'list' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                viewMode === 'map' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Map
            </button>
          </div>
        </div>

        {/* Search Bar with Intelligent Spelling & Auto-Complete Suggestions */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search by brand or generic name (e.g. Amoxicillin, Lipitor, Tylenol, Augmentin, Ventolin, Omeprazole)..."
              className="w-full pl-12 pr-28 py-3.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-4 focus:ring-teal-500/20 text-sm font-medium text-slate-900"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Auto-Complete Suggestion Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 divide-y divide-slate-100">
              <div className="px-4 py-2 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                <span>Matching Medicines & Active Ingredients</span>
                <span className="text-teal-600">Click to add to search</span>
              </div>
              {suggestions.map(({ medicine, score, matchType, matchedTerm }) => (
                <div
                  key={medicine.id}
                  onClick={() => handleSelectMedicine(medicine)}
                  className="p-3.5 hover:bg-teal-50/50 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-navy-900">{medicine.name}</span>
                      {matchType === 'fuzzy' && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                          Spelling Match: &ldquo;{matchedTerm}&rdquo;
                        </span>
                      )}
                      {matchType === 'brand' && (
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                          Brand: {matchedTerm}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Active Ingredient: <strong className="text-slate-700">{medicine.generic_name}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Dosage Form: {medicine.dosage_form} • Strengths: {medicine.strengths.join(', ')}
                    </p>
                  </div>

                  <button className="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Select</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACTIVE MULTI-MEDICINE SEARCH BASKET CHIPS */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Prescribed Medicine Search Basket</span>
              <span className="text-[11px] font-semibold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                {queryBasket.length} {queryBasket.length === 1 ? 'Medicine' : 'Medicines'}
              </span>
            </span>
            <span className="text-[11px] text-slate-500">
              Stores stocking <strong>all items</strong> in your basket appear first
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {queryBasket.map((item) => {
              const medObj = allMedicines.find(m => m.id === item.matched_medicine_id);
              const availableStrengths = medObj?.strengths || [item.strength];

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 pl-3 pr-2 py-2 rounded-2xl bg-teal-50/70 border border-teal-200/90 text-xs shadow-sm"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-navy-900 block">{item.name}</span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      {/* Strength Selector for Exact Strength Enforcement */}
                      <label className="text-slate-500">Strength:</label>
                      <select
                        value={item.strength}
                        onChange={(e) => handleUpdateBasketStrength(item.id, e.target.value)}
                        className="bg-white border border-teal-300 rounded px-1.5 py-0.5 font-bold text-teal-800 focus:outline-none"
                      >
                        {availableStrengths.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                      <span>• {item.dosage_form}</span>
                    </div>
                  </div>

                  {queryBasket.length > 1 && (
                    <button
                      onClick={() => handleRemoveFromBasket(item.id)}
                      className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-white transition-colors ml-1"
                      title="Remove from search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* IMPORTANT MEDICAL SAFETY & EXACT STRENGTH NOTICE */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-800">Strict Medical Safety & Dosage Policy:</strong> MedFinder strictly queries exact prescribed strengths and dosage forms. We never substitute different strengths (e.g. 250mg x 2 for 500mg) or suggest unprescribed drug alternatives. Only verified inventory updated recently (within the last 24 hours) is marked as in stock.
          </div>
        </div>

        {/* FILTER CONTROLS BAR: SORTING, RADIUS & AVAILABILITY */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2 text-xs border-t border-slate-100">
          {/* Sort By Dropdown (Requirements 6 & 7) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Sort Results By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SearchSortOption)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="nearest">📍 Nearest Pharmacy (Distance)</option>
              <option value="most_available">📦 Most Medicines Available</option>
              <option value="lowest_price">💲 Lowest Listed Price</option>
            </select>
          </div>

          {/* Distance Radius Slider (Requirement 4 & 5) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-slate-700">Search Radius</label>
              <span className="text-[11px] font-bold text-teal-700">{maxDistanceKm} km</span>
            </div>
            <input
              type="range"
              min={2}
              max={35}
              step={1}
              value={maxDistanceKm}
              onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          {/* In Stock Only Checkbox */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl border border-slate-200 hover:bg-slate-50 w-full select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 accent-teal-600"
              />
              <span className="text-xs font-semibold text-slate-700">Available In Stock Only</span>
            </label>
          </div>

          {/* Location Indicator */}
          <div className="flex items-end">
            <button
              onClick={requestBrowserLocation}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-teal-600" />
              <span>Near: {location.cityName.split(' ')[0]}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH RESULTS SECTION */}
      <div className={`grid gap-6 ${
        viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
      }`}>
        {/* Results List Column */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-7' : 'w-full'} space-y-6`}>
            
            {/* CATEGORY 1: PRIORITIZED COMPLETE MATCHES (Requirement 6: Prioritize pharmacies with ALL requested medicines) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <h2 className="font-extrabold text-lg text-navy-900">
                      Single-Stop Pharmacies (All Items In Stock)
                    </h2>
                    <p className="text-xs text-slate-500">
                      These pharmacies carry 100% of your requested medicines with recent inventory confirmation.
                    </p>
                  </div>
                </div>

                <span className="bg-emerald-50 text-emerald-800 font-bold text-xs px-3 py-1 rounded-full border border-emerald-200">
                  {searchResults.completeMatches.length} Found
                </span>
              </div>

              {searchResults.completeMatches.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-700">No single pharmacy currently has all {queryBasket.length} medicines in stock simultaneously.</p>
                  <p className="text-[11px] text-slate-500">Review partial match pharmacies below to collect your prescription.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.completeMatches.map((res) => (
                    <div
                      key={res.pharmacy.id}
                      className="bg-white rounded-3xl p-5 border-2 border-emerald-400/80 shadow-md hover:shadow-lg transition-all space-y-4"
                    >
                      {/* Pharmacy Info & Distance */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-500 text-white font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full">
                              100% Complete Match
                            </span>
                            <span className="text-xs text-slate-500">• License: {res.pharmacy.license_number}</span>
                          </div>
                          <h3 className="font-extrabold text-base text-navy-900">{res.pharmacy.name}</h3>
                          <p className="text-xs text-slate-500">{res.pharmacy.address}</p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="inline-block px-2.5 py-1 rounded-xl bg-navy-900 text-white font-extrabold text-xs shadow-sm">
                            {res.distance_km} km away
                          </span>
                          <span className="text-xs text-slate-500 block mt-1">
                            Est. Total: <strong className="text-slate-900 text-sm">₹{res.total_price.toFixed(2)}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Matched Medicines List with Stock Verification Timestamps */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        {res.matched_items.map((m, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">{m.queryItem.name}</span>
                                <span className="px-2 py-0.5 rounded-full bg-white text-emerald-800 font-bold text-[11px] border border-emerald-200">
                                  {m.inventoryItem.strength}
                                </span>
                                <span className="text-xs text-slate-500">{m.inventoryItem.dosage_form}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Active Ingredient: {m.medicine.generic_name}
                              </p>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                              <StatusBadge
                                status={m.effective_status}
                                quantity={m.inventoryItem.quantity}
                                verifiedAt={m.inventoryItem.last_verified_at}
                                isRecent={m.inventoryItem.is_recently_verified}
                                size="sm"
                              />
                              <span className="font-black text-sm text-slate-900">₹{m.inventoryItem.price.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <a
                            href={`tel:${res.pharmacy.phone}`}
                            className="text-xs text-slate-600 hover:text-navy-900 font-semibold flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5 text-teal-600" />
                            <span>{res.pharmacy.phone}</span>
                          </a>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${res.pharmacy.latitude},${res.pharmacy.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline font-semibold"
                          >
                            Directions ↗
                          </a>
                        </div>

                        <button
                          onClick={() => handleOpenReservation(res.pharmacy, res.matched_items)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Reserve Medicines</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CATEGORY 2: PARTIAL MATCH PHARMACIES */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-base text-navy-900">
                    Partial Availability Pharmacies
                  </h2>
                  <p className="text-xs text-slate-500">
                    Stores carrying some of your medicines or with unconfirmed verification statuses.
                  </p>
                </div>
                <span className="bg-slate-100 text-slate-700 font-bold text-xs px-2.5 py-0.5 rounded-full">
                  {searchResults.partialMatches.length} Found
                </span>
              </div>

              <div className="space-y-3">
                {searchResults.partialMatches.map((res) => (
                  <div
                    key={res.pharmacy.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                          {res.available_count} of {res.total_queried} Medicines Available
                        </span>
                        <h3 className="font-bold text-base text-navy-900 mt-1">{res.pharmacy.name}</h3>
                        <p className="text-xs text-slate-500">{res.pharmacy.address}</p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                          {res.distance_km} km
                        </span>
                        {res.total_price > 0 && (
                          <span className="text-xs text-slate-500 block mt-1 font-semibold">
                            Partial: ₹{res.total_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Breakdown of Available vs Out of Stock */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {res.matched_items.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                          <div>
                            <span className="font-semibold text-slate-800">{m.queryItem.name}</span>
                            <span className="text-slate-500 text-[11px] ml-1">({m.inventoryItem.strength})</span>
                          </div>
                          <StatusBadge
                            status={m.effective_status}
                            quantity={m.inventoryItem.quantity}
                            verifiedAt={m.inventoryItem.last_verified_at}
                            isRecent={m.inventoryItem.is_recently_verified}
                            size="sm"
                          />
                        </div>
                      ))}

                      {res.unmatched_items.map((un, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-rose-50/50 text-rose-700">
                          <span>✕ {un.name} ({un.strength})</span>
                          <span className="text-[11px] font-semibold text-rose-600">Not Carried / Out of Stock</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <a href={`tel:${res.pharmacy.phone}`} className="text-xs text-slate-500 hover:text-navy-900">
                          📞 Call
                        </a>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${res.pharmacy.latitude},${res.pharmacy.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Directions ↗
                        </a>
                      </div>
                      <button
                        onClick={() => handleOpenReservation(res.pharmacy, res.matched_items.filter(m => m.is_available))}
                        disabled={res.available_count === 0}
                        className="px-3.5 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs disabled:opacity-40"
                      >
                        Reserve Available ({res.available_count})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Map View Column */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-5' : 'w-full'}`}>
            <div className="sticky top-24 space-y-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  Live OpenStreetMap Distance Radar
                </span>
                <span className="text-slate-500">{mapMarkers.length} pharmacies mapped</span>
              </div>

              <PharmacyMapWrapper
                userLocation={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  cityName: location.cityName
                }}
                pharmacies={mapMarkers}
                height={viewMode === 'map' ? '650px' : '560px'}
              />
            </div>
          </div>
        )}
      </div>

      {/* Reservation & Enquiry Modal */}
      {enquiryPharmacy && (
        <EnquiryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pharmacy={enquiryPharmacy}
          items={enquiryItems}
        />
      )}
    </div>
  );
}

export default function MedicineSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
