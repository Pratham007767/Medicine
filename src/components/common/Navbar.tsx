'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useGeolocation, PRESET_LOCATIONS } from '@/lib/useGeolocation';
import { 
  Cross, 
  Search, 
  FileText, 
  MapPin, 
  Store, 
  Menu, 
  X, 
  User, 
  ChevronDown,
  Navigation,
  Check
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isPharmacyOwner, switchRole } = useAuth();
  const { location, requestBrowserLocation, setPresetLocation } = useGeolocation();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  const navLinks = [
    { href: '/search', label: 'Search Medicine', icon: Search },
    { href: '/prescription', label: 'Upload Prescription', icon: FileText },
    { href: '/pharmacies', label: 'Pharmacy Locator', icon: MapPin },
    { href: '/pharmacy-dashboard', label: 'Pharmacy Dashboard', icon: Store, ownerOnly: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-navy-800 flex items-center justify-center text-teal-400 shadow-md group-hover:scale-105 transition-transform">
              <div className="relative">
                <Cross className="w-5 h-5 fill-teal-400 stroke-teal-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-navy-900">
                Med<span className="text-teal-600">Finder</span>
              </span>
              <span className="block text-[10px] text-slate-500 font-medium tracking-wider uppercase -mt-1">
                Smart Pharmacy Locator
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              if (link.ownerOnly && !isPharmacyOwner) return null;
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-semibold'
                      : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Location Selector & User Role */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Location Pill */}
            <div className="relative">
              <button
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 font-medium transition-colors"
                title="Change detected search location"
              >
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span className="max-w-[140px] truncate">{location.cityName}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {locationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-800">Search Center</span>
                    <button
                      onClick={() => {
                        requestBrowserLocation();
                        setLocationDropdownOpen(false);
                      }}
                      className="text-[11px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      Use GPS
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Select a metropolitan district to calculate real-time driving/walking distance:
                  </p>
                  <div className="space-y-1">
                    {PRESET_LOCATIONS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setPresetLocation(preset.name, preset.lat, preset.lng);
                          setLocationDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 flex items-center justify-between text-slate-700"
                      >
                        <span>{preset.name}</span>
                        {location.cityName === preset.name && (
                          <Check className="w-3.5 h-3.5 text-teal-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile / Role Badge */}
            <Link
              href={isPharmacyOwner ? '/pharmacy-dashboard' : '/auth'}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-navy-900 text-white hover:bg-navy-800 text-xs font-medium transition-all shadow-sm"
            >
              <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
                {isPharmacyOwner ? <Store className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>
              <span className="hidden lg:inline">{user ? user.name.split(' ')[0] : 'Sign In'}</span>
              <span className="text-[10px] text-teal-300 bg-teal-950/60 px-1.5 py-0.5 rounded-full">
                {isPharmacyOwner ? 'Pharmacy' : 'Patient'}
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => {
            if (link.ownerOnly && !isPharmacyOwner) return null;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Icon className="w-5 h-5 text-teal-600" />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between py-1 text-xs text-slate-600">
              <span>Location:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[170px]">{location.cityName}</span>
            </div>
            <button
              onClick={() => {
                requestBrowserLocation();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200"
            >
              <Navigation className="w-3.5 h-3.5 text-teal-600" />
              <span>Use Current GPS Location</span>
            </button>
            <Link
              href={isPharmacyOwner ? '/pharmacy-dashboard' : '/auth'}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-navy-900 text-white font-medium text-sm"
            >
              {isPharmacyOwner ? 'Open Pharmacy Dashboard' : (user ? `Account (${user.name.split(' ')[0]})` : 'Sign In / Register')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
