'use client';

import { useState, useEffect, useCallback } from 'react';

export interface LocationState {
  latitude: number;
  longitude: number;
  accuracy?: number;
  loading: boolean;
  error?: string;
  source: 'browser' | 'default' | 'custom';
  cityName: string;
}

// Default center: Gauhati University, Jalukbari, Guwahati, Assam (781014)
export const DEFAULT_COORDS = {
  latitude: 26.1540,
  longitude: 91.6616,
  cityName: 'Gauhati University (Jalukbari, Assam)'
};

export const PRESET_LOCATIONS = [
  { name: 'Gauhati University Campus', lat: 26.1540, lng: 91.6616 },
  { name: 'Jalukbari Point / Flyover', lat: 26.1480, lng: 91.6670 },
  { name: 'Maligaon Chariali (Kamakhya)', lat: 26.1585, lng: 91.6920 },
  { name: 'Bharalumukh (MG Road)', lat: 26.1720, lng: 91.7280 },
  { name: 'Panbazar / Paltan Bazaar', lat: 26.1850, lng: 91.7450 },
  { name: 'Dispur / GS Road Capital Complex', lat: 26.1420, lng: 91.7900 }
];

const LOCATION_STORAGE_KEY = 'medfinder_user_location_v2';

export function useGeolocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: DEFAULT_COORDS.latitude,
    longitude: DEFAULT_COORDS.longitude,
    loading: false,
    source: 'default',
    cityName: DEFAULT_COORDS.cityName
  });

  // Load stored location or auto-trigger GPS on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.latitude && parsed.longitude) {
          setLocation({
            ...parsed,
            loading: false
          });
          return;
        }
      }
    } catch {}

    // Auto-detect browser GPS on initial load if supported
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setLocation(prev => ({ ...prev, loading: true }));
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc: LocationState = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            loading: false,
            source: 'browser',
            cityName: 'Your Live GPS Location (Guwahati / Assam)'
          };
          setLocation(newLoc);
          try {
            localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLoc));
          } catch {}
        },
        () => {
          // Fallback gracefully to Gauhati University
          setLocation({
            latitude: DEFAULT_COORDS.latitude,
            longitude: DEFAULT_COORDS.longitude,
            loading: false,
            source: 'default',
            cityName: DEFAULT_COORDS.cityName
          });
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    }
  }, []);

  const requestBrowserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false
      }));
      return;
    }

    setLocation(prev => ({ ...prev, loading: true, error: undefined }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const liveLoc: LocationState = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          source: 'browser',
          cityName: 'Your Live GPS Location (Assam)'
        };
        setLocation(liveLoc);
        try {
          localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(liveLoc));
        } catch {}
      },
      (err) => {
        console.warn('Geolocation denied or failed, defaulting to Gauhati University:', err.message);
        const fallbackLoc: LocationState = {
          latitude: DEFAULT_COORDS.latitude,
          longitude: DEFAULT_COORDS.longitude,
          loading: false,
          error: 'GPS permission denied or unavailable. Using Gauhati University coordinates.',
          source: 'default',
          cityName: DEFAULT_COORDS.cityName
        };
        setLocation(fallbackLoc);
        try {
          localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(fallbackLoc));
        } catch {}
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  const setPresetLocation = useCallback((name: string, lat: number, lng: number) => {
    const customLoc: LocationState = {
      latitude: lat,
      longitude: lng,
      loading: false,
      source: 'custom',
      cityName: name
    };
    setLocation(customLoc);
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(customLoc));
    } catch {}
  }, []);

  return {
    location,
    requestBrowserLocation,
    setPresetLocation
  };
}
