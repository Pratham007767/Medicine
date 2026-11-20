import React from 'react';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';

export default function MedicalDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600">
        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span>
          <strong>Medical Notice:</strong> MedFinder locates availability only. We never make clinical decisions, recommend substitutions, or store prescriptions permanently.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Licensed Pharmacy Verification</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Only verified pharmacies with active government licenses can publish and update inventory. MedFinder never provides clinical diagnosis, drug substitution recommendations, or medical advice. Always consult your prescribing physician.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Privacy & Prescription Safety</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Prescription documents are processed locally for medicine entity extraction. Unencrypted prescription images are never stored permanently without patient consent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
