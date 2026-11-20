'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Store, 
  MapPin, 
  Phone, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Send, 
  ShieldCheck, 
  RotateCcw,
  Package,
  Layers,
  ChevronRight
} from 'lucide-react';
import { PrescriptionExtractedItem, PharmacyMatch, Pharmacy } from '@/types';
import { InventoryService } from '@/lib/inventoryService';
import { useGeolocation } from '@/lib/useGeolocation';
import StatusBadge from '@/components/common/StatusBadge';
import EnquiryModal from '@/components/common/EnquiryModal';
import PharmacyMapWrapper from '@/components/map/PharmacyMapWrapper';

export default function ResultsDashboardPage() {
  const router = useRouter();
  const { location } = useGeolocation();

  const [prescriptionTitle, setPrescriptionTitle] = useState('Scanned Prescription');
  const [medicines, setMedicines] = useState<PrescriptionExtractedItem[]>([]);
  const [fullMatches, setFullMatches] = useState<PharmacyMatch[]>([]);
  const [partialMatches, setPartialMatches] = useState<PharmacyMatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Enquiry modal state
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [enquiryItems, setEnquiryItems] = useState<{ medicine_name: string; strength: string; quantity: number }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function evaluatePrescription() {
      setLoading(true);
      try {
        const stored = sessionStorage.getItem('medfinder_active_prescription');
        let prescItems: PrescriptionExtractedItem[] = [];

        if (stored) {
          const parsed = JSON.parse(stored);
          setPrescriptionTitle(parsed.filename || 'Scanned Prescription');
          prescItems = parsed.items || [];
        } else {
          // Default fallback demo prescription for direct link visitors
          prescItems = [
            {
              id: 'demo-1',
              raw_text: 'Amoxicillin 500mg',
              detected_name: 'Amoxicillin',
              matched_medicine_id: 'med-1',
              strength: '500mg',
              dosage_form: 'Capsule',
              quantity: 20,
              confidence: 98,
              is_uncertain: false,
              needs_manual_review: false,
              confirmed: true
            },
            {
              id: 'demo-2',
              raw_text: 'Paracetamol 650mg',
              detected_name: 'Paracetamol',
              matched_medicine_id: 'med-3',
              strength: '650mg',
              dosage_form: 'Tablet',
              quantity: 15,
              confidence: 96,
              is_uncertain: false,
              needs_manual_review: false,
              confirmed: true
            },
            {
              id: 'demo-3',
              raw_text: 'Omeprazole 20mg',
              detected_name: 'Omeprazole',
              matched_medicine_id: 'med-7',
              strength: '20mg',
              dosage_form: 'Capsule',
              quantity: 14,
              confidence: 94,
              is_uncertain: false,
              needs_manual_review: false,
              confirmed: true
            }
          ];
        }

        setMedicines(prescItems);

        // Run multi-medicine match evaluation
        const res = await InventoryService.findPharmaciesForPrescription(prescItems, {
          lat: location.latitude,
          lng: location.longitude
        });

        setFullMatches(res.fullMatches);
        setPartialMatches(res.partialMatches);
      } catch (err) {
        console.error('Failed to evaluate prescription matches:', err);
      } finally {
        setLoading(false);
      }
    }

    evaluatePrescription();
  }, [location]);

  // Open Enquiry Modal
  const handleOpenEnquiry = (match: PharmacyMatch) => {
    setSelectedPharmacy(match.pharmacy);
    setEnquiryItems(
      match.matched_medicines.map(m => ({
        medicine_name: m.item.detected_name,
        strength: m.item.strength,
        quantity: m.item.quantity
      }))
    );
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            MULTI-MEDICINE STOCK ANALYSIS
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Prescription Match Results
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Comparing inventory for <strong>{medicines.length} prescribed medicines</strong> across all registered pharmacies near {location.cityName}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/prescription"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Scan Another Rx
          </Link>
        </div>
      </div>

      {/* Extracted Medicines Summary Cards */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Package className="w-4 h-4 text-teal-600" />
          <span>Prescribed Medications in this Basket:</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {medicines.map((med, idx) => (
            <div
              key={med.id || idx}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-sm text-navy-900">{med.detected_name}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="font-semibold text-teal-700">{med.strength}</span>
                  <span>• {med.dosage_form}</span>
                  <span>• Qty: {med.quantity}</span>
                </div>
              </div>
              <span className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                ✓
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORY 1: FULL MATCHES (All medicines in one stop) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-900">
                Single-Stop Pharmacies (100% In Stock)
              </h2>
              <p className="text-xs text-slate-500">
                These pharmacies currently stock <strong>all {medicines.length}</strong> of your prescribed medicines. Saves multiple trips!
              </p>
            </div>
          </div>

          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs px-3 py-1 rounded-full">
            {fullMatches.length} Found
          </span>
        </div>

        {fullMatches.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="font-bold text-sm text-slate-800">No Single Pharmacy Has All Items</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Check our partial match section below for pharmacies that stock most of your medicines, or use our split-trip optimizer.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {fullMatches.map((match) => (
              <div
                key={match.pharmacy.id}
                className="bg-white rounded-3xl p-6 border-2 border-emerald-400/80 shadow-md hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Badge & Pharmacy Name */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1 bg-emerald-500 text-white font-bold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-sm mb-1.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Complete Basket Match
                      </span>
                      <h3 className="font-extrabold text-lg text-navy-900">
                        {match.pharmacy.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {match.pharmacy.address} • <strong className="text-teal-700">{match.distance_km} km away</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Estimated Total</span>
                      <span className="text-xl font-black text-slate-900">
                        ₹{match.total_estimated_cost.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Stock List breakdown */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-600 block uppercase tracking-wider">
                      Confirmed In Stock:
                    </span>
                    {match.matched_medicines.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-emerald-50/50 p-2 rounded-xl border border-emerald-100"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="font-semibold text-slate-800">{m.item.detected_name}</span>
                          <span className="text-slate-500 text-[11px]">({m.inventory.strength})</span>
                        </div>
                        <span className="font-bold text-emerald-800">₹{m.inventory.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <a
                      href={`tel:${match.pharmacy.phone}`}
                      className="text-xs text-slate-600 hover:text-navy-900 font-semibold flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5 text-teal-600" />
                      {match.pharmacy.phone}
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${match.pharmacy.latitude},${match.pharmacy.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      Directions ↗
                    </a>
                  </div>

                  <button
                    onClick={() => handleOpenEnquiry(match)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Reserve All Medicines</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CATEGORY 2: PARTIAL MATCHES */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-navy-900">
              Partial Availability Pharmacies
            </h2>
            <p className="text-xs text-slate-500">
              Pharmacies that have some of your prescribed medicines in stock.
            </p>
          </div>
          <span className="bg-slate-100 text-slate-700 font-bold text-xs px-3 py-1 rounded-full">
            {partialMatches.length} Found
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {partialMatches.map((match) => (
            <div
              key={match.pharmacy.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                    {match.matched_medicines.length} of {medicines.length} Medicines ({match.match_percentage}%)
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {match.distance_km} km
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-navy-900">{match.pharmacy.name}</h3>
                  <p className="text-xs text-slate-500">{match.pharmacy.address}</p>
                </div>

                {/* In Stock Breakdown */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] font-semibold text-emerald-700 block">Available:</span>
                  {match.matched_medicines.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-700">
                      <span>✓ {m.item.detected_name} ({m.inventory.strength})</span>
                      <span className="font-semibold">₹{m.inventory.price.toFixed(2)}</span>
                    </div>
                  ))}

                  {/* Missing Breakdown */}
                  {match.missing_medicines.length > 0 && (
                    <>
                      <span className="text-[11px] font-semibold text-rose-600 block pt-1">Out of Stock here:</span>
                      {match.missing_medicines.map((m, idx) => (
                        <div key={idx} className="text-rose-500 text-xs flex items-center gap-1">
                          <span>✕</span>
                          <span>{m.detected_name}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${match.pharmacy.phone}`}
                    className="text-xs text-slate-500 hover:text-navy-900"
                  >
                    📞 Call
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${match.pharmacy.latitude},${match.pharmacy.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Directions ↗
                  </a>
                </div>
                <button
                  onClick={() => handleOpenEnquiry(match)}
                  className="px-3.5 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs transition-colors"
                >
                  Reserve Available
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Map View for Matching Pharmacies */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-navy-900">Interactive Map Locator</h2>
          </div>
          <span className="text-xs text-slate-500">
            Pulsing pins indicate pharmacy availability for your basket
          </span>
        </div>
        <PharmacyMapWrapper
          userLocation={{
            latitude: location.latitude,
            longitude: location.longitude,
            cityName: location.cityName
          }}
          pharmacies={[...fullMatches, ...partialMatches].map(m => ({
            pharmacy: m.pharmacy,
            distance_km: m.distance_km,
            status: m.match_percentage === 100 ? 'in_stock' : 'low_stock',
            medicineName: medicines.map(x => x.detected_name).join(', '),
            price: m.total_estimated_cost
          }))}
          height="450px"
        />
      </div>

      {/* Enquiry Modal */}
      {selectedPharmacy && (
        <EnquiryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pharmacy={selectedPharmacy}
          items={enquiryItems}
        />
      )}
    </div>
  );
}
