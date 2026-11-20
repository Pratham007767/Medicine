'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { InventoryService } from '@/lib/inventoryService';
import { 
  Pharmacy, 
  InventoryItem, 
  Medicine, 
  AvailabilityEnquiry, 
  DosageForm, 
  AvailabilityStatus,
  InventoryHistoryLog 
} from '@/types';
import StatusBadge from '@/components/common/StatusBadge';
import { 
  Store, 
  Package, 
  AlertTriangle, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  Inbox, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Search, 
  RefreshCw,
  Phone,
  Clock,
  Send,
  X,
  Filter,
  History,
  Check,
  Building,
  Settings,
  AlertCircle,
  FileCheck,
  BadgeAlert,
  ChevronRight,
  MapPin,
  ExternalLink
} from 'lucide-react';

export default function PharmacyDashboardPage() {
  const router = useRouter();
  const { user, isPharmacyOwner, switchRole } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'inventory' | 'enquiries' | 'history' | 'profile'>('inventory');

  // Master Data
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [activePharmacy, setActivePharmacy] = useState<Pharmacy | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [enquiries, setEnquiries] = useState<AvailabilityEnquiry[]>([]);
  const [historyLogs, setHistoryLogs] = useState<InventoryHistoryLog[]>([]);
  const [catalogMedicines, setCatalogMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AvailabilityStatus>('all');
  const [formFilter, setFormFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'name' | 'qty_low' | 'qty_high' | 'price_low' | 'price_high'>('recent');

  // Add Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [customGeneric, setCustomGeneric] = useState('');
  const [newStrength, setNewStrength] = useState('500mg');
  const [newForm, setNewForm] = useState<DosageForm>('Tablet');
  const [newQuantity, setNewQuantity] = useState(100);
  const [newPrice, setNewPrice] = useState(15.00);

  // Edit Item Modal
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editGeneric, setEditGeneric] = useState('');
  const [editStrength, setEditStrength] = useState('');
  const [editForm, setEditForm] = useState<DosageForm>('Tablet');
  const [editQuantity, setEditQuantity] = useState(0);
  const [editPrice, setEditPrice] = useState(0);
  const [editStatus, setEditStatus] = useState<AvailabilityStatus>('in_stock');

  // Register New Pharmacy Modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regLicense, setRegLicense] = useState('');
  const [regOwner, setRegOwner] = useState('');
  const [regPhone, setRegPhone] = useState('+91 361 257 0199');
  const [regAddress, setRegAddress] = useState('Near Gauhati University Gate 2, Jalukbari, Guwahati 781014');
  const [regHours, setRegHours] = useState('Mon-Sat: 8:00 AM - 9:30 PM');
  const [regVerified, setRegVerified] = useState(true);

  // Edit Profile State
  const [profileName, setProfileName] = useState('');
  const [profileLicense, setProfileLicense] = useState('');
  const [profileOwner, setProfileOwner] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileHours, setProfileHours] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Load pharmacy data
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [pharms, meds] = await Promise.all([
        InventoryService.getPharmacies(),
        InventoryService.getMedicines()
      ]);

      setPharmacies(pharms);
      setCatalogMedicines(meds);

      // Find active pharmacy (default to user's assigned pharmacy or first pharmacy)
      const currentPharm = pharms.find(p => p.id === user?.pharmacy_id) || pharms[0];
      setActivePharmacy(currentPharm);

      if (currentPharm) {
        populateProfile(currentPharm);
        await reloadPharmacyData(currentPharm.id);
      }

      setLoading(false);
    }
    load();
  }, [user]);

  const populateProfile = (pharm: Pharmacy) => {
    setProfileName(pharm.name);
    setProfileLicense(pharm.license_number);
    setProfileOwner(pharm.owner_name);
    setProfilePhone(pharm.phone);
    setProfileAddress(pharm.address);
    setProfileHours(pharm.opening_hours);
  };

  const reloadPharmacyData = async (pharmId: string) => {
    const [pharmInv, pharmEnq, pharmHist] = await Promise.all([
      InventoryService.getPharmacyInventory(pharmId),
      InventoryService.getEnquiries(pharmId),
      InventoryService.getInventoryHistory(pharmId)
    ]);
    setInventory(pharmInv);
    setEnquiries(pharmEnq);
    setHistoryLogs(pharmHist);
  };

  // Switch active pharmacy
  const handleSelectPharmacy = async (pharmId: string) => {
    const found = pharmacies.find(p => p.id === pharmId);
    if (!found) return;
    setActivePharmacy(found);
    populateProfile(found);
    await reloadPharmacyData(found.id);
  };

  // Quick inline quantity update
  const handleQuickQtyChange = async (itemId: string, delta: number) => {
    if (!activePharmacy?.verified) {
      alert('Only verified pharmacy accounts are permitted to publish stock availability.');
      return;
    }

    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    const newQty = Math.max(0, item.quantity + delta);
    const updated = await InventoryService.updateInventoryItem(itemId, { quantity: newQty });

    if (updated) {
      setInventory(prev => prev.map(i => i.id === itemId ? { ...i, ...updated } : i));
      const hist = await InventoryService.getInventoryHistory(activePharmacy.id);
      setHistoryLogs(hist);
    }
  };

  // Direct quantity change input
  const handleDirectQtyChange = async (itemId: string, newQty: number) => {
    if (!activePharmacy?.verified) {
      alert('Only verified pharmacy accounts are permitted to publish stock availability.');
      return;
    }

    const updated = await InventoryService.updateInventoryItem(itemId, { quantity: Math.max(0, newQty) });
    if (updated && activePharmacy) {
      setInventory(prev => prev.map(i => i.id === itemId ? { ...i, ...updated } : i));
      const hist = await InventoryService.getInventoryHistory(activePharmacy.id);
      setHistoryLogs(hist);
    }
  };

  // Direct price change input
  const handlePriceChange = async (itemId: string, newPrice: number) => {
    if (!activePharmacy?.verified) {
      alert('Only verified pharmacy accounts are permitted to publish stock availability.');
      return;
    }

    const updated = await InventoryService.updateInventoryItem(itemId, { price: Math.max(0, newPrice) });
    if (updated && activePharmacy) {
      setInventory(prev => prev.map(i => i.id === itemId ? { ...i, ...updated } : i));
      const hist = await InventoryService.getInventoryHistory(activePharmacy.id);
      setHistoryLogs(hist);
    }
  };

  // Toggle or mark Out of Stock
  const handleToggleStockStatus = async (item: InventoryItem) => {
    if (!activePharmacy?.verified) {
      alert('Only verified pharmacy accounts are permitted to publish stock availability.');
      return;
    }

    const newStatus: AvailabilityStatus = item.status === 'out_of_stock' ? 'in_stock' : 'out_of_stock';
    const newQty = newStatus === 'out_of_stock' ? 0 : 50;

    const updated = await InventoryService.updateInventoryItem(item.id, { 
      status: newStatus,
      quantity: newQty
    });

    if (updated && activePharmacy) {
      setInventory(prev => prev.map(i => i.id === item.id ? { ...i, ...updated } : i));
      const hist = await InventoryService.getInventoryHistory(activePharmacy.id);
      setHistoryLogs(hist);
    }
  };

  // Open Edit Medicine Modal
  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditName(item.custom_name || item.medicine?.name || '');
    setEditBrand(item.custom_brand || item.medicine?.brand_names[0] || '');
    setEditGeneric(item.custom_generic || item.medicine?.generic_name || '');
    setEditStrength(item.strength);
    setEditForm(item.dosage_form);
    setEditQuantity(item.quantity);
    setEditPrice(item.price);
    setEditStatus(item.status);
  };

  // Save Edit Medicine Modal
  const handleSaveEditMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !activePharmacy) return;

    if (!activePharmacy.verified) {
      alert('Only verified pharmacy accounts are permitted to publish stock availability.');
      return;
    }

    const updated = await InventoryService.editInventoryItem(editingItem.id, {
      custom_name: editName,
      custom_brand: editBrand,
      custom_generic: editGeneric,
      strength: editStrength,
      dosage_form: editForm,
      quantity: Number(editQuantity),
      price: Number(editPrice),
      status: editStatus
    });

    if (updated) {
      await reloadPharmacyData(activePharmacy.id);
      setEditingItem(null);
    }
  };

  // Add new medicine inventory item
  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePharmacy) return;

    if (!activePharmacy.verified) {
      alert('Only verified pharmacy accounts are permitted to publish stock availability.');
      return;
    }

    let medId = selectedMedId;
    let medName = customName;
    let medGeneric = customGeneric;
    let medBrand = customBrand;

    if (selectedMedId) {
      const found = catalogMedicines.find(m => m.id === selectedMedId);
      if (found) {
        medName = found.name;
        medGeneric = found.generic_name;
        medBrand = found.brand_names[0] || found.name;
      }
    } else {
      medId = `custom-med-${Date.now()}`;
    }

    await InventoryService.addInventoryItem({
      pharmacy_id: activePharmacy.id,
      medicine_id: medId,
      custom_name: medName,
      custom_brand: medBrand,
      custom_generic: medGeneric,
      strength: newStrength,
      dosage_form: newForm,
      quantity: Number(newQuantity),
      price: Number(newPrice),
      status: Number(newQuantity) > 10 ? 'in_stock' : (Number(newQuantity) > 0 ? 'low_stock' : 'out_of_stock')
    });

    await reloadPharmacyData(activePharmacy.id);
    setIsAddModalOpen(false);
    setSelectedMedId('');
    setCustomName('');
  };

  // Register New Pharmacy Store
  const handleRegisterPharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regLicense.trim()) return;

    const created = await InventoryService.registerPharmacy({
      owner_name: regOwner || user?.name || 'Dr. Evelyn Reed, PharmD',
      name: regName,
      license_number: regLicense,
      email: user?.email || 'manager@medfinder-rx.org',
      phone: regPhone,
      address: regAddress,
      city: 'Guwahati',
      state: 'Assam',
      postal_code: '781014',
      latitude: 26.1510,
      longitude: 91.6635,
      opening_hours: regHours
    });

    // If verification was checked
    if (regVerified) {
      await InventoryService.verifyPharmacy(created.id, true);
      created.verified = true;
    } else {
      await InventoryService.verifyPharmacy(created.id, false);
      created.verified = false;
    }

    setPharmacies(prev => [created, ...prev]);
    setActivePharmacy(created);
    populateProfile(created);
    await reloadPharmacyData(created.id);
    setIsRegisterOpen(false);
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePharmacy) return;

    const updated = await InventoryService.updatePharmacyProfile(activePharmacy.id, {
      name: profileName,
      license_number: profileLicense,
      owner_name: profileOwner,
      phone: profilePhone,
      address: profileAddress,
      opening_hours: profileHours
    });

    if (updated) {
      setActivePharmacy(updated);
      setPharmacies(prev => prev.map(p => p.id === updated.id ? updated : p));
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
      const hist = await InventoryService.getInventoryHistory(updated.id);
      setHistoryLogs(hist);
    }
  };

  // Verify / Unverify Toggle Action (State Board License Simulator)
  const handleToggleVerification = async () => {
    if (!activePharmacy) return;
    const newStatus = !activePharmacy.verified;
    const updated = await InventoryService.verifyPharmacy(activePharmacy.id, newStatus);
    if (updated) {
      setActivePharmacy(updated);
      setPharmacies(prev => prev.map(p => p.id === updated.id ? updated : p));
      const hist = await InventoryService.getInventoryHistory(updated.id);
      setHistoryLogs(hist);
    }
  };

  // Update Enquiry Status
  const handleEnquiryStatus = async (enquiryId: string, status: AvailabilityEnquiry['status']) => {
    const updated = await InventoryService.updateEnquiryStatus(enquiryId, status);
    if (updated && activePharmacy) {
      setEnquiries(prev => prev.map(e => e.id === enquiryId ? updated : e));
    }
  };

  // Filtered & Sorted Inventory List
  const filteredInventory = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();

    return inventory
      .filter(item => {
        const medName = (item.custom_name || item.medicine?.name || '').toLowerCase();
        const brandName = (item.custom_brand || (item.medicine?.brand_names || []).join(' ')).toLowerCase();
        const genericName = (item.custom_generic || item.medicine?.generic_name || '').toLowerCase();

        // Search match
        if (q && !medName.includes(q) && !brandName.includes(q) && !genericName.includes(q)) {
          return false;
        }

        // Status match
        if (statusFilter !== 'all' && item.status !== statusFilter) {
          return false;
        }

        // Form match
        if (formFilter !== 'all' && item.dosage_form.toLowerCase() !== formFilter.toLowerCase()) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'name') {
          const nameA = a.custom_name || a.medicine?.name || '';
          const nameB = b.custom_name || b.medicine?.name || '';
          return nameA.localeCompare(nameB);
        }
        if (sortOrder === 'qty_low') {
          return a.quantity - b.quantity;
        }
        if (sortOrder === 'qty_high') {
          return b.quantity - a.quantity;
        }
        if (sortOrder === 'price_low') {
          return a.price - b.price;
        }
        if (sortOrder === 'price_high') {
          return b.price - a.price;
        }
        // default recent
        return (b.verification_timestamp || 0) - (a.verification_timestamp || 0);
      });
  }, [inventory, searchFilter, statusFilter, formFilter, sortOrder]);

  // Statistics
  const inStockCount = inventory.filter(i => i.status === 'in_stock').length;
  const lowStockCount = inventory.filter(i => i.status === 'low_stock').length;
  const outOfStockCount = inventory.filter(i => i.status === 'out_of_stock').length;
  const pendingEnquiriesCount = enquiries.filter(e => e.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* PHARMACY OWNER DASHBOARD HEADER & PROFILE CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shadow-sm">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-navy-900">
                  {activePharmacy?.name || 'Pharmacy Dispensary'}
                </h1>

                {activePharmacy?.verified ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Pharmacy
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full text-xs font-bold animate-pulse shadow-sm">
                    <BadgeAlert className="w-3.5 h-3.5 text-amber-600" />
                    Verification Pending
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1">
                State License: <strong className="text-slate-700">{activePharmacy?.license_number}</strong> • Manager: {activePharmacy?.owner_name}
              </p>
              <p className="text-xs text-slate-500">
                📍 {activePharmacy?.address} • 📞 {activePharmacy?.phone} • 🕒 {activePharmacy?.opening_hours}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Pharmacy Switcher */}
            <select
              value={activePharmacy?.id || ''}
              onChange={(e) => handleSelectPharmacy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-slate-700"
            >
              {pharmacies.map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.verified ? '(Verified)' : '(Unverified)'}</option>
              ))}
            </select>

            <button
              onClick={() => setIsRegisterOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              + Register Store
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              disabled={!activePharmacy?.verified}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${
                activePharmacy?.verified
                  ? 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Medicine
            </button>
          </div>
        </div>

        {/* UNVERIFIED ACCOUNT RESTRICTION NOTICE */}
        {!activePharmacy?.verified && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-start gap-2.5">
              <BadgeAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">License Verification Required:</strong> Under public safety guidelines, only verified pharmacy accounts are permitted to publish stock availability to patients. Your listing is currently hidden from public search.
              </div>
            </div>
            <button
              onClick={handleToggleVerification}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm whitespace-nowrap self-end sm:self-auto"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Simulate State Board Verification</span>
            </button>
          </div>
        )}

        {/* KPI METRIC CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Catalogued
            </span>
            <span className="text-2xl font-black text-navy-900 mt-1 block">
              {inventory.length}
            </span>
            <span className="text-[10px] text-teal-600 font-semibold">Active Medicines</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              In Stock (Ready)
            </span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              {inStockCount}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">&gt; 10 units available</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              Low Stock Warning
            </span>
            <span className="text-2xl font-black text-amber-700 mt-1 block">
              {lowStockCount}
            </span>
            <span className="text-[10px] text-amber-600 font-semibold">&lt; 10 units remaining</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
              Patient Enquiries
            </span>
            <span className="text-2xl font-black text-blue-700 mt-1 block">
              {pendingEnquiriesCount}
            </span>
            <span className="text-[10px] text-blue-600 font-semibold">Hold & pickup requests</span>
          </div>
        </div>

        {/* DASHBOARD NAVIGATION TABS */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs font-bold">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'inventory'
                ? 'bg-navy-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:text-navy-900 hover:bg-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Manage Inventory ({inventory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('enquiries')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'enquiries'
                ? 'bg-navy-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:text-navy-900 hover:bg-slate-200'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Patient Enquiries ({enquiries.length})</span>
            {pendingEnquiriesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-navy-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:text-navy-900 hover:bg-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Update History ({historyLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'profile'
                ? 'bg-navy-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:text-navy-900 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Pharmacy Profile & Verification</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          {/* Controls: Search, Filters, Sorting */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-lg text-navy-900">Live Medicine Inventory Catalog</h2>
              <p className="text-xs text-slate-500">
                Update available stock quantities, adjust prices, edit medicine information, or mark items out of stock.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto text-xs">
              {/* Search across name, brand, generic */}
              <div className="relative col-span-2 sm:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search name, brand, generic..."
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800"
                >
                  <option value="all">All Statuses</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="unconfirmed">Unconfirmed</option>
                </select>
              </div>

              {/* Dosage Form Filter */}
              <div>
                <select
                  value={formFilter}
                  onChange={(e) => setFormFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800"
                >
                  <option value="all">All Dosage Forms</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Inhaler">Inhaler</option>
                  <option value="Syrup">Syrup</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800"
                >
                  <option value="recent">Recently Updated</option>
                  <option value="name">Name A-Z</option>
                  <option value="qty_low">Qty: Low to High</option>
                  <option value="qty_high">Qty: High to Low</option>
                  <option value="price_low">Price: Low to High</option>
                </select>
              </div>
            </div>
          </div>

          {/* INVENTORY TABLE: CONTAINS ALL REQUIRED FIELDS */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pl-2">Medicine & Brand Name</th>
                  <th className="pb-3">Generic Ingredient</th>
                  <th className="pb-3">Strength & Form</th>
                  <th className="pb-3">Available Quantity</th>
                  <th className="pb-3">Price (₹)</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Last Updated</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No matching medicines found in inventory.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const medName = item.custom_name || item.medicine?.name || 'Medicine';
                    const brandName = item.custom_brand || (item.medicine?.brand_names[0] || 'Brand');
                    const genericName = item.custom_generic || item.medicine?.generic_name || 'Active ingredient';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Medicine & Brand */}
                        <td className="py-3.5 pl-2">
                          <span className="font-extrabold text-sm text-navy-900 block">{medName}</span>
                          <span className="text-[11px] text-teal-700 font-semibold">Brand: {brandName}</span>
                        </td>

                        {/* 2. Generic Ingredient */}
                        <td className="py-3.5">
                          <span className="text-slate-700 font-medium block max-w-[160px] truncate" title={genericName}>
                            {genericName}
                          </span>
                        </td>

                        {/* 3. Strength & Dosage Form */}
                        <td className="py-3.5">
                          <span className="font-bold text-slate-900 block">{item.strength}</span>
                          <span className="text-[11px] text-slate-500">{item.dosage_form}</span>
                        </td>

                        {/* 4. Quantity with Inline Quick Buttons */}
                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleQuickQtyChange(item.id, -10)}
                              className="w-6 h-6 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs"
                              title="Decrease 10 units"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => handleDirectQtyChange(item.id, parseInt(e.target.value, 10) || 0)}
                              className="w-16 px-2 py-1 rounded-lg border border-slate-300 text-center font-bold text-xs"
                            />
                            <button
                              onClick={() => handleQuickQtyChange(item.id, +10)}
                              className="w-6 h-6 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs"
                              title="Increase 10 units"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* 5. Price with Inline Input */}
                        <td className="py-3.5">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-bold">₹</span>
                            <input
                              type="number"
                              step="0.10"
                              value={item.price}
                              onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 rounded-lg border border-slate-300 font-bold text-xs"
                            />
                          </div>
                        </td>

                        {/* 6. Stock Status Badge */}
                        <td className="py-3.5">
                          <StatusBadge
                            status={item.status}
                            quantity={item.quantity}
                            verifiedAt={item.last_verified_at}
                            isRecent={item.is_recently_verified}
                            size="sm"
                          />
                        </td>

                        {/* 7. Last Updated Timestamp */}
                        <td className="py-3.5">
                          <span className="text-[11px] text-slate-500 block">{item.last_updated}</span>
                          <span className="text-[10px] text-slate-400 block">{item.last_verified_at}</span>
                        </td>

                        {/* 8. Quick Actions: Edit, Toggle Out of Stock */}
                        <td className="py-3.5 pr-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-200 transition-colors"
                              title="Edit complete medicine details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStockStatus(item)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                item.status === 'out_of_stock'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                            >
                              {item.status === 'out_of_stock' ? 'Restock' : 'Mark OOS'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PATIENT ENQUIRIES INBOX */}
      {activeTab === 'enquiries' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-lg text-navy-900">Patient Availability Enquiries</h2>
              <p className="text-xs text-slate-500">
                Patients send stock reservation requests to hold essential medicines before driving to your store.
              </p>
            </div>
            <span className="bg-teal-50 text-teal-800 border border-teal-200 font-bold text-xs px-3 py-1 rounded-full">
              {enquiries.length} Requests
            </span>
          </div>

          {enquiries.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No patient enquiries received yet.</p>
              <p className="text-slate-400">Enquiries sent by patients via search or prescription scanner appear here in real-time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{enq.user_name}</span>
                      <span className="text-slate-500 font-semibold">📞 {enq.user_phone}</span>
                      {enq.user_email && <span className="text-slate-400">✉️ {enq.user_email}</span>}
                      <span className="text-[11px] text-slate-400">• {enq.created_at}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-slate-600 font-bold">Requested Medicines:</span>
                      {enq.medicines.map((m, idx) => (
                        <span key={idx} className="bg-white px-2.5 py-1 rounded-xl border border-slate-200 font-semibold text-navy-900">
                          {m.medicine_name} ({m.strength}) × {m.quantity}
                        </span>
                      ))}
                    </div>

                    {enq.notes && (
                      <p className="text-slate-600 italic pt-1">“{enq.notes}”</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto justify-end">
                    {enq.status === 'confirmed' ? (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          Reserved & Held
                        </span>
                        <button
                          onClick={() => handleEnquiryStatus(enq.id, 'fulfilled')}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
                        >
                          Mark Picked Up
                        </button>
                      </div>
                    ) : enq.status === 'fulfilled' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1">
                        <Check className="w-4 h-4 text-slate-500" />
                        Completed & Picked Up
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEnquiryStatus(enq.id, 'confirmed')}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition-all"
                        >
                          Confirm & Hold Stock
                        </button>
                        <button
                          onClick={() => handleEnquiryStatus(enq.id, 'rejected')}
                          className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
                        >
                          Decline / Out
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INVENTORY UPDATE HISTORY AUDIT LOG */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-lg text-navy-900">Inventory Update History Log</h2>
              <p className="text-xs text-slate-500">
                Audited chronological log of all stock adjustments, price changes, status updates, and additions.
              </p>
            </div>
            <span className="bg-slate-100 text-slate-700 font-bold text-xs px-3 py-1 rounded-full">
              {historyLogs.length} Events Logged
            </span>
          </div>

          {historyLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No inventory history logs recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {historyLogs.map((log) => (
                <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-600 mt-0.5">
                      <Clock className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold text-sm">{log.medicine_name}</strong>
                        <span className="text-teal-700 font-semibold">({log.strength})</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                          {log.change_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{log.details}</p>
                      <p className="text-[11px] text-slate-400">By: {log.performed_by}</p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap pl-9 sm:pl-0">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PHARMACY PROFILE & VERIFICATION SETTINGS */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-lg text-navy-900">Pharmacy Profile & Official Licensing</h2>
              <p className="text-xs text-slate-500">
                Manage business contact, dispensing pharmacist credentials, physical address, and verification state.
              </p>
            </div>

            <button
              onClick={handleToggleVerification}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                activePharmacy?.verified
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{activePharmacy?.verified ? 'Revoke License Verification' : 'Verify Pharmacy License'}</span>
            </button>
          </div>

          {profileSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Pharmacy profile changes saved and updated successfully across the network!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs max-w-2xl">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pharmacy Business Name *</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Government Pharmacy License # *</label>
                <input
                  type="text"
                  required
                  value={profileLicense}
                  onChange={(e) => setProfileLicense(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dispensing Pharmacist / Manager *</label>
                <input
                  type="text"
                  required
                  value={profileOwner}
                  onChange={(e) => setProfileOwner(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Direct Phone Number *</label>
                <input
                  type="text"
                  required
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={profileHours}
                  onChange={(e) => setProfileHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Physical Street Address *</label>
              <input
                type="text"
                required
                value={profileAddress}
                onChange={(e) => setProfileAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-md transition-all"
              >
                Save Pharmacy Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD MEDICINE TO INVENTORY */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-navy-900 text-base">Add Medicine to Inventory</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddInventory} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select from Master Catalog (Optional)</label>
                <select
                  value={selectedMedId}
                  onChange={(e) => {
                    setSelectedMedId(e.target.value);
                    const found = catalogMedicines.find(m => m.id === e.target.value);
                    if (found) {
                      setCustomName(found.name);
                      setCustomBrand(found.brand_names[0] || found.name);
                      setCustomGeneric(found.generic_name);
                      setNewStrength(found.strengths[0] || '500mg');
                      setNewForm(found.dosage_form);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-medium"
                >
                  <option value="">-- Or enter custom medicine formulation below --</option>
                  {catalogMedicines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.generic_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amoxicillin"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Amoxil"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Generic Ingredient *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amoxicillin Trihydrate"
                    value={customGeneric}
                    onChange={(e) => setCustomGeneric(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Strength (e.g. 500mg) *</label>
                  <input
                    type="text"
                    required
                    value={newStrength}
                    onChange={(e) => setNewStrength(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dosage Form *</label>
                  <select
                    value={newForm}
                    onChange={(e) => setNewForm(e.target.value as DosageForm)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Drops">Drops</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity Available *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price per Unit (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-sm"
                >
                  Add to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT COMPLETE MEDICINE DETAILS */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-navy-900 text-base">Edit Medicine Information</h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMedicine} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Generic Ingredient *</label>
                  <input
                    type="text"
                    required
                    value={editGeneric}
                    onChange={(e) => setEditGeneric(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Strength *</label>
                  <input
                    type="text"
                    required
                    value={editStrength}
                    onChange={(e) => setEditStrength(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dosage Form *</label>
                  <select
                    value={editForm}
                    onChange={(e) => setEditForm(e.target.value as DosageForm)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Drops">Drops</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as AvailabilityStatus)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="unconfirmed">Unconfirmed</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER PHARMACY STORE */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-navy-900 text-base">Register New Pharmacy Location</h3>
              <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPharmacy} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pharmacy Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Health & Wellness"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State License # *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PH-NY-99120"
                    value={regLicense}
                    onChange={(e) => setRegLicense(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Manager / Pharmacist Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Jane Doe, PharmD"
                    value={regOwner}
                    onChange={(e) => setRegOwner(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={regHours}
                    onChange={(e) => setRegHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={regVerified}
                    onChange={(e) => setRegVerified(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-800">Verified Dispensary Account</span>
                    <p className="text-[10px] text-slate-500">Uncheck to test the unverified restricted state</p>
                  </div>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-sm"
                >
                  Register Pharmacy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
