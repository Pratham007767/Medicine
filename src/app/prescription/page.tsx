'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Edit2, 
  Trash2, 
  Plus, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  ShieldCheck, 
  Loader2, 
  RefreshCw,
  Image as ImageIcon,
  AlertTriangle,
  HelpCircle,
  Eye,
  Lock,
  Store,
  Phone,
  Clock,
  Send,
  Check,
  ChevronDown,
  Navigation
} from 'lucide-react';
import { SAMPLE_PRESCRIPTIONS, INITIAL_MEDICINES } from '@/lib/data/mockData';
import { parsePrescriptionFile, extractMedicinesFromText } from '@/lib/ocr/prescriptionParser';
import { 
  PrescriptionExtractedItem, 
  DosageForm, 
  Pharmacy, 
  InventoryItem, 
  AvailabilityStatus,
  PharmacySearchResult 
} from '@/types';
import { InventoryService } from '@/lib/inventoryService';
import { useGeolocation } from '@/lib/useGeolocation';
import { searchPharmaciesForMedicines } from '@/lib/searchEngine';
import StatusBadge from '@/components/common/StatusBadge';
import MedicalDisclaimer from '@/components/common/MedicalDisclaimer';
import EnquiryModal from '@/components/common/EnquiryModal';
import PharmacyMapWrapper from '@/components/map/PharmacyMapWrapper';

export default function PrescriptionUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { location } = useGeolocation();

  // Upload & File State
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [rawOcrText, setRawOcrText] = useState<string | null>(null);
  const [showRawOcr, setShowRawOcr] = useState(false);

  // Extracted Medicines State (Every item requires manual confirmation)
  const [extractedMedicines, setExtractedMedicines] = useState<PrescriptionExtractedItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Manual Add Medicine Inputs
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStrength, setNewStrength] = useState('500mg');
  const [newForm, setNewForm] = useState<DosageForm>('Tablet');
  const [newQty, setNewQty] = useState(10);

  // Pharmacy Matching State (Only populated after user confirms all medicines)
  const [isSearchingPharmacies, setIsSearchingPharmacies] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [allPharmacies, setAllPharmacies] = useState<Pharmacy[]>([]);
  const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
  const [matchingResults, setMatchingResults] = useState<{
    allPharmacies: PharmacySearchResult[];
    completeMatches: PharmacySearchResult[];
    partialMatches: PharmacySearchResult[];
  }>({ allPharmacies: [], completeMatches: [], partialMatches: [] });

  // Enquiry Modal State
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [enquiryItems, setEnquiryItems] = useState<{ medicine_name: string; strength: string; quantity: number }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load pharmacy master data
  useEffect(() => {
    async function loadMasterData() {
      const [pharms, invs] = await Promise.all([
        InventoryService.getPharmacies(),
        InventoryService.getInventory()
      ]);
      setAllPharmacies(pharms);
      setAllInventory(invs);
    }
    loadMasterData();
  }, []);

  // Cleanup object URL when component unmounts to protect user data
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle file drop / upload
  const handleFile = async (uploadedFile: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(uploadedFile.type.toLowerCase())) {
      alert('Unsupported file format. Please upload a PDF, JPG, or PNG prescription document.');
      return;
    }

    const MAX_SIZE = 15 * 1024 * 1024; // 15MB limit
    if (uploadedFile.size <= 0) {
      alert('Uploaded file is empty (0 bytes). Please select a valid document.');
      return;
    }
    if (uploadedFile.size > MAX_SIZE) {
      alert(`File size exceeds the 15MB maximum limit (Received: ${(uploadedFile.size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller scan.`);
      return;
    }

    // Revoke previous object URL if any (Protect user data)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(uploadedFile);
    if (uploadedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(uploadedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    setIsProcessing(true);
    setProgressPercent(15);
    setProgressStage('Enhancing image contrast & segmenting text lines...');
    setHasSearched(false);

    try {
      const result = await parsePrescriptionFile(uploadedFile, (stage, percent) => {
        setProgressStage(stage);
        setProgressPercent(percent);
      });

      setExtractedMedicines(result.extracted_medicines);
      setRawOcrText(result.raw_text || null);
    } catch (err: any) {
      alert(err.message || 'Failed to process prescription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Load sample prescription for instant testing
  const loadSample = (sampleId: string) => {
    const sample = SAMPLE_PRESCRIPTIONS.find(s => s.id === sampleId);
    if (!sample) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    setFile(new File(['sample-rx'], `${sample.title}.pdf`, { type: 'application/pdf' }));
    setHasSearched(false);

    const items: PrescriptionExtractedItem[] = sample.medicines.map((m, idx) => ({
      id: `sample-item-${Date.now()}-${idx}`,
      raw_text: `${m.detected_name} ${m.strength} #${m.quantity} - ${m.instructions}`,
      detected_name: m.detected_name,
      strength: m.strength,
      dosage_form: m.dosage_form as DosageForm,
      quantity: m.quantity,
      instructions: m.instructions,
      confidence: idx === 1 ? 74 : 96,
      is_uncertain: idx === 1,
      uncertainty_reason: idx === 1 ? 'Check dosage strength on slip before confirming' : undefined,
      needs_manual_review: idx === 1,
      confirmed: false // User must review & confirm
    }));

    setExtractedMedicines(items);
    setRawOcrText(sample.previewText);
  };

  // Toggle or mark confirmation for a specific medicine item
  const handleToggleConfirmMedicine = (id: string) => {
    setExtractedMedicines(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          confirmed: !item.confirmed,
          is_uncertain: false,
          needs_manual_review: false
        };
      }
      return item;
    }));
  };

  // Confirm all medicines at once
  const handleConfirmAll = () => {
    setExtractedMedicines(prev => prev.map(item => ({
      ...item,
      confirmed: true,
      is_uncertain: false,
      needs_manual_review: false
    })));
  };

  // Delete an extracted medicine
  const handleDeleteMedicine = (id: string) => {
    setExtractedMedicines(prev => prev.filter(item => item.id !== id));
  };

  // Update an extracted medicine field
  const handleUpdateMedicine = (id: string, updates: Partial<PrescriptionExtractedItem>) => {
    setExtractedMedicines(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, ...updates, confirmed: true, is_uncertain: false, needs_manual_review: false };
      }
      return item;
    }));
  };

  // Add a new medicine manually
  const handleAddMedicine = () => {
    if (!newName.trim()) return;

    const matched = INITIAL_MEDICINES.find(m => 
      m.name.toLowerCase() === newName.toLowerCase() ||
      m.generic_name.toLowerCase().includes(newName.toLowerCase())
    );

    const newItem: PrescriptionExtractedItem = {
      id: `custom-item-${Date.now()}`,
      raw_text: `${newName} ${newStrength} #${newQty}`,
      detected_name: matched ? matched.name : newName.trim(),
      matched_medicine_id: matched?.id,
      matched_medicine: matched,
      strength: newStrength,
      dosage_form: newForm,
      quantity: Number(newQty) || 10,
      confidence: 100,
      is_uncertain: false,
      needs_manual_review: false,
      confirmed: true // Manually added items are confirmed by patient
    };

    setExtractedMedicines(prev => [...prev, newItem]);
    setNewName('');
    setIsAddingNew(false);
  };

  // Validation: Check if every medicine is confirmed
  const allConfirmed = useMemo(() => {
    return extractedMedicines.length > 0 && extractedMedicines.every(m => m.confirmed);
  }, [extractedMedicines]);

  const confirmedCount = useMemo(() => {
    return extractedMedicines.filter(m => m.confirmed).length;
  }, [extractedMedicines]);

  // Execute Search: Only allowed after user confirms every medicine
  const handleSearchNearbyPharmacies = () => {
    if (!allConfirmed) {
      alert('Please confirm all extracted medicines before searching the pharmacy database.');
      return;
    }

    setIsSearchingPharmacies(true);

    // Prepare query basket
    const basket = extractedMedicines.map(m => ({
      name: m.detected_name,
      matched_medicine_id: m.matched_medicine_id,
      strength: m.strength,
      dosage_form: m.dosage_form,
      quantity: m.quantity
    }));

    // Run pharmacy search with user location
    const results = searchPharmaciesForMedicines(
      basket,
      allPharmacies,
      allInventory,
      INITIAL_MEDICINES,
      { latitude: location.latitude, longitude: location.longitude },
      'nearest'
    );

    setMatchingResults(results);
    setHasSearched(true);
    setIsSearchingPharmacies(false);

    // Save confirmed prescription in session storage for the results dashboard
    sessionStorage.setItem('medfinder_active_prescription', JSON.stringify({
      filename: file?.name || 'Confirmed Prescription',
      items: extractedMedicines
    }));

    // Smooth scroll down to matched pharmacies section
    setTimeout(() => {
      const el = document.getElementById('pharmacy-results-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  // Map markers payload for matched pharmacies
  const mapMarkers = useMemo(() => {
    return matchingResults.allPharmacies.map(r => ({
      pharmacy: r.pharmacy,
      distance_km: r.distance_km,
      status: r.has_all_medicines 
        ? ('in_stock' as AvailabilityStatus) 
        : (r.available_count > 0 ? ('low_stock' as AvailabilityStatus) : ('out_of_stock' as AvailabilityStatus)),
      medicineName: extractedMedicines.map(m => m.detected_name).join(', '),
      price: r.total_price
    }));
  }, [matchingResults, extractedMedicines]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold tracking-wide">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>PRESCRIPTION SCANNER & VERIFICATION WORKFLOW</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900">
          Scan Prescription & Check Nearby Stock
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Upload your prescription (PDF, JPG, or PNG). Our Optical Character Recognition extracts prescribed medicines, strengths, forms, and quantities for your direct confirmation before querying pharmacies.
        </p>
      </div>

      {/* SAMPLE PRESCRIPTIONS QUICK-TEST BAR */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Test drive immediately with sample clinical prescriptions:</span>
          </div>
          <span className="text-[11px] text-slate-400">1-click test</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_PRESCRIPTIONS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => loadSample(sample.id)}
              className="text-left p-3 rounded-xl bg-white hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 transition-all text-xs shadow-sm group"
            >
              <div className="font-bold text-navy-900 group-hover:text-teal-700 flex items-center justify-between">
                <span>{sample.title}</span>
                <span className="text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded font-semibold">Load</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{sample.doctor}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{sample.previewText}</p>
            </button>
          ))}
        </div>
      </div>

      {/* WORKFLOW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: File Dropzone & Privacy Guarantees */}
        <div className="lg:col-span-5 space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-teal-500 bg-teal-50/50 scale-[1.01]'
                : 'border-slate-300 hover:border-teal-400 bg-white hover:bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="font-bold text-navy-900 text-base mb-1">
              Upload Prescription Document
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Accepted formats: PDF, JPG, and PNG (Max 15MB)
            </p>

            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Select File from Device
            </button>
          </div>

          {/* Active File Card */}
          {file && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 truncate max-w-[190px]">
                    {file.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB • Ready for extraction
                  </p>
                </div>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Change
              </button>
            </div>
          )}

          {/* Raw Scanned OCR Text Inspection Accordion */}
          {rawOcrText && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
              <button
                onClick={() => setShowRawOcr(!showRawOcr)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-navy-900"
              >
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-teal-600" />
                  Inspect Raw OCR Scanned Text
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showRawOcr ? 'rotate-180' : ''}`} />
              </button>

              {showRawOcr && (
                <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-line leading-relaxed">
                  {rawOcrText}
                </div>
              )}
            </div>
          )}

          {/* Strict Rules & Privacy Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>OCR Safety & Privacy Rules</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-600 list-disc list-inside">
              <li><strong>OCR is not a medical verification system:</strong> Never make clinical decisions based on automated scans.</li>
              <li><strong>Never guess unclear names:</strong> Uncertain or unreadable entries are flagged for your manual review.</li>
              <li><strong>No automatic substitutions:</strong> We preserve exact prescribed brand and generic formulations.</li>
              <li><strong>Privacy protection:</strong> Temporary file references are wiped from memory once processing is complete.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Processing Animation & Confirmation Screen */}
        <div className="lg:col-span-7 space-y-5">
          {/* Scanning Progress Bar */}
          {isProcessing && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto" />
              <div>
                <h4 className="font-bold text-navy-900 text-base">{progressStage}</h4>
                <p className="text-xs text-slate-500 mt-1">Analyzing pharmacological entities without clinical alteration</p>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden max-w-md mx-auto">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="bg-teal-500 h-full rounded-full transition-all duration-300"
                />
              </div>
            </div>
          )}

          {/* EDITABLE CONFIRMATION SCREEN (Steps 4 & 5) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-navy-900">
                    Verify Extracted Medicines
                  </h3>
                  <span className={`font-bold text-xs px-2.5 py-0.5 rounded-full border ${
                    allConfirmed 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {confirmedCount} of {extractedMedicines.length} Confirmed
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  You must confirm or correct every extracted entry before searching pharmacies.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {extractedMedicines.length > 0 && !allConfirmed && (
                  <button
                    onClick={handleConfirmAll}
                    className="text-xs text-teal-700 hover:text-teal-800 font-bold bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    Confirm All ({extractedMedicines.length})
                  </button>
                )}
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  Add Medicine
                </button>
              </div>
            </div>

            {/* Empty State */}
            {extractedMedicines.length === 0 && !isProcessing && (
              <div className="text-center py-12 space-y-3">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-700">No prescription uploaded yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Upload an image or PDF of your prescription on the left, or test drive with one of our demo clinical presets above.
                </p>
              </div>
            )}

            {/* List of Extracted Medicines for User Confirmation */}
            <div className="space-y-3">
              {extractedMedicines.map((item) => {
                const isEditing = editingItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      item.confirmed
                        ? 'bg-emerald-50/30 border-emerald-200/90'
                        : item.is_uncertain
                          ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-300/50'
                          : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    {isEditing ? (
                      /* Editing Form */
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="sm:col-span-2">
                            <label className="font-bold text-slate-700 block mb-1">Medicine Name *</label>
                            <input
                              type="text"
                              value={item.detected_name}
                              onChange={(e) => handleUpdateMedicine(item.id, { detected_name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Strength *</label>
                            <input
                              type="text"
                              value={item.strength}
                              onChange={(e) => handleUpdateMedicine(item.id, { strength: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Quantity *</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateMedicine(item.id, { quantity: parseInt(e.target.value, 10) || 1 })}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                          <button
                            onClick={() => setEditingItemId(null)}
                            className="px-3.5 py-1.5 rounded-lg bg-teal-600 text-white font-bold text-xs shadow-sm"
                          >
                            Save & Confirm
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Display Row with Confirmation Toggle */
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          {/* Raw text & Uncertainty alert */}
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm">
                              {item.detected_name}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full bg-white text-teal-800 border border-teal-200 font-bold text-[11px]">
                              {item.strength}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                              {item.dosage_form}
                            </span>

                            {item.is_uncertain && (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Review Required: Unclear text
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>Quantity: <strong>{item.quantity}</strong></span>
                            {item.instructions && (
                              <span className="text-slate-400 italic">“{item.instructions}”</span>
                            )}
                          </div>

                          {item.uncertainty_reason && (
                            <p className="text-[11px] text-amber-700 font-medium">
                              ⚠️ {item.uncertainty_reason}
                            </p>
                          )}
                        </div>

                        {/* Actions & Confirmation Button */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
                          <button
                            onClick={() => setEditingItemId(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-200/60 transition-colors"
                            title="Edit medicine details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMedicine(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove medicine"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Explicit User Confirmation Toggle */}
                          <button
                            onClick={() => handleToggleConfirmMedicine(item.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                              item.confirmed
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-amber-500 hover:bg-amber-600 text-white'
                            }`}
                          >
                            {item.confirmed ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Confirmed</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Confirm Accuracy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Inline Add Medicine Drawer */}
            {isAddingNew && (
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-3">
                <span className="text-xs font-bold text-teal-900 uppercase tracking-wider block">
                  Add Prescribed Medicine Manually
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">Medicine Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Paracetamol or Amoxicillin"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Strength</label>
                    <input
                      type="text"
                      value={newStrength}
                      onChange={(e) => setNewStrength(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Quantity</label>
                    <input
                      type="number"
                      value={newQty}
                      onChange={(e) => setNewQty(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsAddingNew(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMedicine}
                    className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors"
                  >
                    Add to Confirmation List
                  </button>
                </div>
              </div>
            )}

            {/* ACTION BAR: SEARCH ONLY ENABLED AFTER 100% USER CONFIRMATION (Step 6) */}
            {extractedMedicines.length > 0 && (
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-600">
                  {allConfirmed ? (
                    <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      All {extractedMedicines.length} medicines verified & confirmed by user.
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Please review & confirm all entries before searching pharmacies.
                    </span>
                  )}
                </div>

                <button
                  onClick={handleSearchNearbyPharmacies}
                  disabled={!allConfirmed || isSearchingPharmacies}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all ${
                    allConfirmed
                      ? 'bg-teal-600 hover:bg-teal-500 text-white hover:scale-[1.01] cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isSearchingPharmacies ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Checking Nearby Stock...</span>
                    </>
                  ) : (
                    <>
                      <span>Search Nearby Pharmacies</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STEP 7: MATCHING NEARBY PHARMACIES RESULTS (DISPLAYED ONLY AFTER CONFIRMATION) */}
      {hasSearched && (
        <div id="pharmacy-results-section" className="pt-8 space-y-6">
          <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                VERIFIED PHARMACY MATCH RESULTS
              </div>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                Nearby Pharmacy Stock for Confirmed Medicines
              </h2>
              <p className="text-xs text-slate-300">
                Searching near {location.cityName}. Sorted by shortest driving distance.
              </p>
            </div>

            <Link
              href="/results"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs shadow-md transition-all"
            >
              <span>Open Detailed Basket Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* List of Matched Pharmacies */}
            <div className="lg:col-span-7 space-y-4">
              {/* CATEGORY 1: SINGLE-STOP COMPLETE MATCHES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-navy-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">✓</span>
                    <span>Single-Stop Pharmacies (All Prescribed Items In Stock)</span>
                  </h3>
                  <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {matchingResults.completeMatches.length} Found
                  </span>
                </div>

                {matchingResults.completeMatches.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 text-center">
                    No single pharmacy currently stocks all {extractedMedicines.length} medicines together. Review partial matches below.
                  </div>
                ) : (
                  matchingResults.completeMatches.map((res) => (
                    <div
                      key={res.pharmacy.id}
                      className="bg-white rounded-3xl p-5 border-2 border-emerald-400/80 shadow-sm hover:shadow-md transition-all space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="bg-emerald-500 text-white font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full">
                            100% In Stock
                          </span>
                          <h4 className="font-extrabold text-base text-navy-900 mt-1">{res.pharmacy.name}</h4>
                          <p className="text-xs text-slate-500">{res.pharmacy.address}</p>
                        </div>

                        <div className="text-right">
                          <span className="inline-block px-2.5 py-1 rounded-xl bg-navy-900 text-white font-bold text-xs shadow-sm">
                            {res.distance_km} km away
                          </span>
                          <span className="text-xs text-slate-500 block mt-1">
                            Est. Total: <strong className="text-slate-900 font-bold">₹{res.total_price.toFixed(2)}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Stock Breakdown with Verification Recency */}
                      <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                        {res.matched_items.map((m, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-emerald-50/50 p-2 rounded-xl">
                            <span className="font-semibold text-slate-800">
                              ✓ {m.queryItem.name} ({m.inventoryItem.strength})
                            </span>
                            <div className="flex items-center gap-2">
                              <StatusBadge
                                status={m.effective_status}
                                quantity={m.inventoryItem.quantity}
                                verifiedAt={m.inventoryItem.last_verified_at}
                                isRecent={m.inventoryItem.is_recently_verified}
                                size="sm"
                              />
                              <span className="font-bold text-slate-900">₹{m.inventoryItem.price.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <a href={`tel:${res.pharmacy.phone}`} className="text-xs text-slate-600 hover:text-navy-900 font-semibold">
                            📞 {res.pharmacy.phone}
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
                          onClick={() => {
                            setSelectedPharmacy(res.pharmacy);
                            setEnquiryItems(res.matched_items.map(m => ({
                              medicine_name: m.queryItem.name,
                              strength: m.queryItem.strength,
                              quantity: m.queryItem.quantity || 1
                            })));
                            setIsModalOpen(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition-all"
                        >
                          Reserve All Items
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* CATEGORY 2: PARTIAL MATCHES */}
              <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-navy-900">
                    Partial Availability Pharmacies
                  </h3>
                  <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {matchingResults.partialMatches.length} Found
                  </span>
                </div>

                {matchingResults.partialMatches.slice(0, 3).map((res) => (
                  <div key={res.pharmacy.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                          {res.available_count} of {res.total_queried} Medicines Available
                        </span>
                        <h4 className="font-bold text-sm text-navy-900 mt-1">{res.pharmacy.name}</h4>
                        <p className="text-[11px] text-slate-500">{res.pharmacy.address}</p>
                      </div>
                      <span className="font-bold text-slate-700">{res.distance_km} km</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <a href={`tel:${res.pharmacy.phone}`} className="text-slate-500 hover:text-navy-900">
                          📞 {res.pharmacy.phone}
                        </a>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${res.pharmacy.latitude},${res.pharmacy.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Directions ↗
                        </a>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPharmacy(res.pharmacy);
                          setEnquiryItems(res.matched_items.filter(m => m.is_available).map(m => ({
                            medicine_name: m.queryItem.name,
                            strength: m.queryItem.strength,
                            quantity: m.queryItem.quantity || 1
                          })));
                          setIsModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-navy-900 text-white font-semibold text-[11px]"
                      >
                        Reserve Available ({res.available_count})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map View on Right */}
            <div className="lg:col-span-5 sticky top-24 space-y-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-teal-600" />
                  Nearby Pharmacy Locations
                </span>
                <span className="text-slate-500">{mapMarkers.length} mapped</span>
              </div>

              <PharmacyMapWrapper
                userLocation={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  cityName: location.cityName
                }}
                pharmacies={mapMarkers}
                height="560px"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reservation & Enquiry Modal */}
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
