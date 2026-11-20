'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Pharmacy, AvailabilityStatus } from '@/types';
import { MapPin, Loader2 } from 'lucide-react';

interface MapPharmacyItem {
  pharmacy: Pharmacy;
  distance_km?: number;
  status?: AvailabilityStatus;
  medicineName?: string;
  price?: number;
}

interface PharmacyMapProps {
  userLocation: { latitude: number; longitude: number; cityName?: string };
  pharmacies: MapPharmacyItem[];
  selectedPharmacyId?: string;
  onSelectPharmacy?: (pharmacyId: string) => void;
  height?: string;
}

// Dynamically import Leaflet component with SSR disabled
const DynamicPharmacyMap = dynamic(() => import('./PharmacyMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-500 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
        <MapPin className="w-4 h-4 text-teal-600" />
        <span>Loading OpenStreetMap & Pharmacy Locations...</span>
      </div>
    </div>
  )
});

export default function PharmacyMapWrapper(props: PharmacyMapProps) {
  return <DynamicPharmacyMap {...props} />;
}
