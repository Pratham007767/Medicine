'use client';

import React, { useState } from 'react';
import { Pharmacy, InventoryItem, PrescriptionExtractedItem } from '@/types';
import { InventoryService } from '@/lib/inventoryService';
import { useAuth } from '@/lib/authContext';
import { X, Send, CheckCircle2, Store, Phone, Clock, AlertCircle } from 'lucide-react';

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacy: Pharmacy;
  items: {
    medicine_name: string;
    strength: string;
    quantity: number;
  }[];
  onSuccess?: () => void;
}

export default function EnquiryModal({
  isOpen,
  onClose,
  pharmacy,
  items,
  onSuccess
}: EnquiryModalProps) {
  const { user } = useAuth();
  const [userName, setUserName] = useState(user?.name || '');
  const [userPhone, setUserPhone] = useState('+1 (555) 234-5678');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('Please confirm availability for pickup today.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userPhone.trim()) {
      setError('Please provide your name and contact phone number.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await InventoryService.createEnquiry({
        pharmacy_id: pharmacy.id,
        pharmacy_name: pharmacy.name,
        user_name: userName,
        user_phone: userPhone,
        user_email: userEmail,
        medicines: items,
        notes
      });

      setIsSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setError('Failed to send enquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-navy-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Check Availability / Reserve</h3>
              <p className="text-xs text-slate-300">{pharmacy.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-navy-800 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900">Enquiry Sent to Pharmacist!</h4>
              <p className="text-sm text-slate-600 mt-2">
                Your request has been delivered to <strong>{pharmacy.name}</strong>. The dispensing pharmacist will review and hold the medicine(s) for your pickup.
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-600 border border-slate-200 text-left">
              <p className="font-semibold text-slate-800 mb-1">Direct Pharmacy Contact:</p>
              <p>📞 Phone: {pharmacy.phone}</p>
              <p>📍 Address: {pharmacy.address}</p>
              <p>🕒 Hours: {pharmacy.opening_hours}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-xl text-sm transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Selected Medicines Summary */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
              <span className="text-xs font-semibold text-slate-600 block mb-2 uppercase tracking-wider">
                Requested Medicine(s):
              </span>
              <div className="space-y-1.5">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200/70">
                    <span className="font-semibold text-slate-800">
                      {item.medicine_name} <span className="text-teal-600 font-normal">({item.strength})</span>
                    </span>
                    <span className="text-slate-600 font-medium">Qty: {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* User Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Note for Pharmacist</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Can pick up at 5 PM today..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-all shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Sending...' : 'Send Enquiry'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
