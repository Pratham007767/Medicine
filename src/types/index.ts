export type AvailabilityStatus = 
  | 'in_stock' 
  | 'low_stock' 
  | 'out_of_stock' 
  | 'unconfirmed';

export type DosageForm = 
  | 'Tablet' 
  | 'Capsule' 
  | 'Syrup' 
  | 'Inhaler' 
  | 'Injection' 
  | 'Ointment' 
  | 'Drops' 
  | 'Suspension';

export interface Medicine {
  id: string;
  name: string; // Brand or primary name
  generic_name: string;
  brand_names: string[];
  category: string;
  dosage_form: DosageForm;
  strengths: string[];
  description: string;
  prescription_required: boolean;
  common_uses: string[];
}

export interface Pharmacy {
  id: string;
  name: string;
  license_number: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  rating: number;
  opening_hours: string;
  verified: boolean;
  is_demo_data: boolean;
}

export interface InventoryItem {
  id: string;
  pharmacy_id: string;
  medicine_id: string;
  medicine?: Medicine;
  pharmacy?: Pharmacy;
  custom_name?: string;
  custom_brand?: string;
  custom_generic?: string;
  strength: string;
  dosage_form: DosageForm;
  quantity: number;
  price: number; // in USD
  status: AvailabilityStatus;
  last_updated: string;
  batch_number?: string;
  expiry_date?: string;
  last_verified_at: string; // Timestamp of pharmacist verification
  verification_timestamp: number; // Epoch timestamp in ms
  verified_by?: string; // Name of pharmacist who verified stock
  is_recently_verified: boolean; // True if verified within past 24 hours
}

export interface SearchQueryItem {
  id?: string;
  name: string;
  matched_medicine_id?: string;
  strength: string;
  dosage_form: DosageForm;
  quantity?: number;
}

export type SearchSortOption = 'nearest' | 'most_available' | 'lowest_price';

export interface PharmacySearchResult {
  pharmacy: Pharmacy;
  distance_km: number;
  matched_items: {
    queryItem: SearchQueryItem;
    inventoryItem: InventoryItem;
    medicine: Medicine;
    is_available: boolean; // in_stock or low_stock AND recently verified
    effective_status: AvailabilityStatus;
  }[];
  unmatched_items: SearchQueryItem[];
  available_count: number;
  total_queried: number;
  match_percentage: number;
  has_all_medicines: boolean;
  total_price: number;
  latest_verification_text: string;
}


export interface PrescriptionExtractedItem {
  id: string;
  raw_text: string;
  detected_name: string;
  matched_medicine_id?: string;
  matched_medicine?: Medicine;
  strength: string;
  dosage_form: DosageForm;
  quantity: number;
  instructions?: string;
  confidence: number; // 0 - 100
  is_uncertain: boolean; // Flagged when confidence is low or text is ambiguous
  uncertainty_reason?: string;
  needs_manual_review: boolean;
  confirmed: boolean; // User must explicitly verify this item
}

export interface PrescriptionScanResult {
  id: string;
  filename: string;
  uploaded_at: string;
  file_size?: number;
  extracted_medicines: PrescriptionExtractedItem[];
  raw_text?: string;
  status: 'processing' | 'completed' | 'error';
  notes?: string;
}

export interface PharmacyMatch {
  pharmacy: Pharmacy;
  matched_medicines: {
    item: PrescriptionExtractedItem;
    inventory: InventoryItem;
  }[];
  missing_medicines: PrescriptionExtractedItem[];
  match_percentage: number;
  total_estimated_cost: number;
  distance_km?: number;
}

export interface AvailabilityEnquiry {
  id: string;
  pharmacy_id: string;
  pharmacy_name?: string;
  user_name: string;
  user_phone: string;
  user_email: string;
  medicines: {
    medicine_name: string;
    strength: string;
    quantity: number;
  }[];
  notes?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'fulfilled';
  created_at: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'pharmacy_owner';
  pharmacy_id?: string;
}

export interface SearchFilters {
  query: string;
  dosage_form?: string;
  strength?: string;
  max_distance_km?: number;
  status_filter?: 'all' | 'in_stock_only';
  sort_by?: 'distance' | 'price' | 'availability';
}

export interface InventoryHistoryLog {
  id: string;
  pharmacy_id: string;
  medicine_id?: string;
  medicine_name: string;
  strength: string;
  change_type: 
    | 'quantity_update' 
    | 'price_update' 
    | 'status_change' 
    | 'medicine_added' 
    | 'medicine_edited'
    | 'stock_verification' 
    | 'profile_update';
  details: string;
  performed_by: string;
  timestamp: string;
  created_at: number;
}

