'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Pharmacy, AvailabilityStatus } from '@/types';

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

export default function PharmacyMap({
  userLocation,
  pharmacies,
  selectedPharmacyId,
  onSelectPharmacy,
  height = '480px'
}: PharmacyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.latitude, userLocation.longitude],
        zoom: 13,
        zoomControl: true,
        attributionControl: true
      });

      // OpenStreetMap Tiles (CartoDB Positron / OSM standard)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers and view when userLocation or pharmacies change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    // 1. Add User Location Marker (Blue pulsing pin)
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-blue-400 opacity-75"></span>
          <div class="relative flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg border-2 border-white ring-2 ring-blue-500">
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 2a10 10 0 0 0-10 10c0 5.25 10 12 10 12s10-6.75 10-12a10 10 0 0 0-10-10z"></path>
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
      icon: userIcon,
      zIndexOffset: 1000
    }).bindPopup(`
      <div class="p-1 font-sans">
        <div class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
          Your Detected Location
        </div>
        <p class="text-xs text-slate-500 mt-1">${userLocation.cityName || 'Searching for nearby pharmacies'}</p>
      </div>
    `);

    markersGroupRef.current.addLayer(userMarker);

    // 2. Add Pharmacy Markers
    const bounds = L.latLngBounds([
      [userLocation.latitude, userLocation.longitude]
    ]);

    pharmacies.forEach((item) => {
      const { pharmacy, distance_km, status, medicineName, price } = item;
      
      let badgeColor = '#0d9488'; // teal / emerald for in_stock
      let statusLabel = 'In Stock';
      if (status === 'low_stock') {
        badgeColor = '#f59e0b'; // amber
        statusLabel = 'Low Stock';
      } else if (status === 'out_of_stock') {
        badgeColor = '#ef4444'; // rose/red
        statusLabel = 'Out of Stock';
      } else if (status === 'unconfirmed') {
        badgeColor = '#64748b'; // slate
        statusLabel = 'Unconfirmed';
      }

      const isSelected = selectedPharmacyId === pharmacy.id;

      const pharmIcon = L.divIcon({
        className: 'custom-pharm-marker',
        html: `
          <div class="group cursor-pointer transition-transform duration-200 hover:scale-110 ${isSelected ? 'scale-125 z-50' : ''}">
            <div style="background-color: ${badgeColor};" class="flex items-center justify-center w-8 h-8 rounded-full text-white shadow-md border-2 border-white">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            ${distance_km ? `
              <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                ${distance_km} km
              </div>
            ` : ''}
          </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 20]
      });

      const marker = L.marker([pharmacy.latitude, pharmacy.longitude], {
        icon: pharmIcon
      });

      marker.bindPopup(`
        <div class="font-sans text-xs p-1 max-w-[220px]">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="font-bold text-slate-900 text-sm leading-tight">${pharmacy.name}</span>
            <span style="background-color: ${badgeColor}20; color: ${badgeColor};" class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              ${statusLabel}
            </span>
          </div>
          <p class="text-slate-600 text-[11px] mb-1.5">${pharmacy.address}</p>
          <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
            <span>${distance_km ? `<strong>${distance_km} km</strong> away` : 'Nearby'}</span>
            <span class="text-amber-500 font-semibold">★ ${pharmacy.rating}</span>
          </div>
          ${price ? `<div class="mt-1 text-emerald-700 font-bold text-xs">₹${price.toFixed(2)}</div>` : ''}
          <div class="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
            <a href="tel:${pharmacy.phone}" class="text-blue-600 hover:underline font-medium text-[11px]">📞 Call</a>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}" target="_blank" rel="noopener noreferrer" class="text-slate-700 hover:text-blue-600 font-medium text-[11px]">Directions ↗</a>
          </div>
        </div>
      `);

      marker.on('click', () => {
        onSelectPharmacy?.(pharmacy.id);
      });

      markersGroupRef.current?.addLayer(marker);
      bounds.extend([pharmacy.latitude, pharmacy.longitude]);
    });

    // Fit map bounds to encompass all visible pharmacies
    if (pharmacies.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else {
      map.setView([userLocation.latitude, userLocation.longitude], 13);
    }
  }, [userLocation, pharmacies, selectedPharmacyId, onSelectPharmacy]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <div 
        ref={mapContainerRef} 
        style={{ height }} 
        className="w-full z-10"
      />
      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md border border-slate-200 text-xs flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-700 font-medium text-[11px]">In Stock</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-slate-700 font-medium text-[11px]">Low Stock</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span className="text-slate-700 font-medium text-[11px]">Out of Stock</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <span className="text-slate-700 font-medium text-[11px]">You</span>
        </div>
      </div>
    </div>
  );
}
