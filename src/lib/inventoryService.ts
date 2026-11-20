import { 
  Medicine, 
  Pharmacy, 
  InventoryItem, 
  AvailabilityEnquiry, 
  PharmacyMatch, 
  PrescriptionExtractedItem,
  AvailabilityStatus,
  InventoryHistoryLog
} from '@/types';
import { 
  INITIAL_MEDICINES, 
  INITIAL_PHARMACIES, 
  INITIAL_INVENTORY, 
  INITIAL_ENQUIRIES 
} from './data/mockData';
import { supabase, isSupabaseConfigured } from './supabase';

const INVENTORY_STORAGE_KEY = 'medfinder_inventory_data_v1';
const PHARMACIES_STORAGE_KEY = 'medfinder_pharmacies_data_v1';
const ENQUIRIES_STORAGE_KEY = 'medfinder_enquiries_data_v1';
const MEDICINES_STORAGE_KEY = 'medfinder_medicines_data_v1';
const HISTORY_STORAGE_KEY = 'medfinder_history_data_v1';

const INITIAL_HISTORY: InventoryHistoryLog[] = [
  {
    id: 'hist-1',
    pharmacy_id: 'pharm-1',
    medicine_name: 'Amoxicillin',
    strength: '500mg',
    change_type: 'quantity_update',
    details: 'Stock replenished: +50 units (Current: 120)',
    performed_by: 'Dr. Evelyn Reed, PharmD',
    timestamp: 'Today at 2:30 PM',
    created_at: Date.now() - 3600000
  },
  {
    id: 'hist-2',
    pharmacy_id: 'pharm-1',
    medicine_name: 'Paracetamol',
    strength: '650mg',
    change_type: 'price_update',
    details: 'Price adjusted from ₹42.00 to ₹38.00',
    performed_by: 'Dr. Evelyn Reed, PharmD',
    timestamp: 'Today at 2:45 PM',
    created_at: Date.now() - 2700000
  },
  {
    id: 'hist-3',
    pharmacy_id: 'pharm-1',
    medicine_name: 'Salbutamol Inhaler',
    strength: '100mcg',
    change_type: 'status_change',
    details: 'Marked Out of Stock (0 units remaining)',
    performed_by: 'Dr. Evelyn Reed, PharmD',
    timestamp: 'Today at 10:30 AM',
    created_at: Date.now() - 18000000
  }
];

// Earth radius in kilometers for distance calculations
const EARTH_RADIUS_KM = 6371;

/**
 * Calculates Haversine distance between two coordinates in kilometers
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((EARTH_RADIUS_KM * c).toFixed(1));
}

// In-memory runtime state for SSR or fallback
let memoryMedicines: Medicine[] = [...INITIAL_MEDICINES];
let memoryPharmacies: Pharmacy[] = [...INITIAL_PHARMACIES];
let memoryInventory: InventoryItem[] = [...INITIAL_INVENTORY];
let memoryEnquiries: AvailabilityEnquiry[] = [...INITIAL_ENQUIRIES];
let memoryHistory: InventoryHistoryLog[] = [...INITIAL_HISTORY];

function getStoredData<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStoredData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

// Service Methods
export const InventoryService = {
  // Get all medicines
  getMedicines: async (): Promise<Medicine[]> => {
    if (typeof window !== 'undefined') {
      const stored = getStoredData<Medicine[]>(MEDICINES_STORAGE_KEY, memoryMedicines);
      return stored;
    }
    return memoryMedicines;
  },

  // Get medicine by ID
  getMedicineById: async (id: string): Promise<Medicine | undefined> => {
    const medicines = await InventoryService.getMedicines();
    return medicines.find(m => m.id === id);
  },

  // Search medicines by name, generic, or brand
  searchMedicines: async (query: string): Promise<Medicine[]> => {
    const q = query.trim().toLowerCase();
    const medicines = await InventoryService.getMedicines();
    if (!q) return medicines;

    return medicines.filter(m => 
      m.name.toLowerCase().includes(q) ||
      m.generic_name.toLowerCase().includes(q) ||
      m.brand_names.some(b => b.toLowerCase().includes(q)) ||
      m.category.toLowerCase().includes(q)
    );
  },

  // Get all pharmacies
  getPharmacies: async (): Promise<Pharmacy[]> => {
    if (typeof window !== 'undefined') {
      const stored = getStoredData<Pharmacy[]>(PHARMACIES_STORAGE_KEY, memoryPharmacies);
      return stored;
    }
    return memoryPharmacies;
  },

  // Get pharmacy by ID
  getPharmacyById: async (id: string): Promise<Pharmacy | undefined> => {
    const pharmacies = await InventoryService.getPharmacies();
    return pharmacies.find(p => p.id === id);
  },

  // Register a new pharmacy (Unverified by default until state board verification)
  registerPharmacy: async (
    newPharm: Omit<Pharmacy, 'id' | 'rating' | 'verified' | 'is_demo_data'>,
    verified: boolean = false
  ): Promise<Pharmacy> => {
    const pharmacies = await InventoryService.getPharmacies();
    const created: Pharmacy = {
      ...newPharm,
      id: `pharm-${Date.now()}`,
      rating: 5.0,
      verified, // default unverified: cannot publish stock until state license is verified
      is_demo_data: false // Live user registrations are distinguished from demo data
    };
    const updated = [created, ...pharmacies];
    memoryPharmacies = updated;
    setStoredData(PHARMACIES_STORAGE_KEY, updated);
    return created;
  },

  // Get all inventory items
  getInventory: async (): Promise<InventoryItem[]> => {
    let items = memoryInventory;
    if (typeof window !== 'undefined') {
      items = getStoredData<InventoryItem[]>(INVENTORY_STORAGE_KEY, memoryInventory);
    }
    const medicines = await InventoryService.getMedicines();
    const pharmacies = await InventoryService.getPharmacies();

    // Hydrate relations
    return items.map(inv => ({
      ...inv,
      medicine: medicines.find(m => m.id === inv.medicine_id),
      pharmacy: pharmacies.find(p => p.id === inv.pharmacy_id)
    }));
  },

  // Get inventory for a specific pharmacy
  getPharmacyInventory: async (pharmacyId: string): Promise<InventoryItem[]> => {
    const all = await InventoryService.getInventory();
    return all.filter(item => item.pharmacy_id === pharmacyId);
  },

  // Update inventory item quantity and price
  updateInventoryItem: async (
    id: string, 
    updates: Partial<Pick<InventoryItem, 'quantity' | 'price' | 'status'>>
  ): Promise<InventoryItem | null> => {
    const current = typeof window !== 'undefined' 
      ? getStoredData<InventoryItem[]>(INVENTORY_STORAGE_KEY, memoryInventory) 
      : memoryInventory;

    const index = current.findIndex(i => i.id === id);
    if (index === -1) return null;

    const existing = current[index];
    const newQty = updates.quantity !== undefined ? updates.quantity : existing.quantity;
    
    // Auto calculate status if quantity is updated and status wasn't explicitly forced
    let newStatus = updates.status || existing.status;
    if (updates.quantity !== undefined && !updates.status) {
      if (newQty === 0) newStatus = 'out_of_stock';
      else if (newQty < 10) newStatus = 'low_stock';
      else newStatus = 'in_stock';
    }

    const updatedItem: InventoryItem = {
      ...existing,
      ...updates,
      quantity: newQty,
      status: newStatus,
      last_updated: 'Just now',
      last_verified_at: 'Just now',
      verification_timestamp: Date.now(),
      is_recently_verified: true
    };

    current[index] = updatedItem;
    memoryInventory = current;
    setStoredData(INVENTORY_STORAGE_KEY, current);

    // Auto-record history log
    if (updates.quantity !== undefined && updates.quantity !== existing.quantity) {
      InventoryService.addHistoryLog({
        pharmacy_id: existing.pharmacy_id,
        medicine_id: existing.medicine_id,
        medicine_name: existing.medicine?.name || existing.custom_name || 'Medicine',
        strength: existing.strength,
        change_type: 'quantity_update',
        details: `Quantity updated from ${existing.quantity} to ${newQty} units`,
        performed_by: existing.verified_by || 'Pharmacist',
        timestamp: 'Just now'
      });
    }

    if (updates.price !== undefined && updates.price !== existing.price) {
      InventoryService.addHistoryLog({
        pharmacy_id: existing.pharmacy_id,
        medicine_id: existing.medicine_id,
        medicine_name: existing.medicine?.name || existing.custom_name || 'Medicine',
        strength: existing.strength,
        change_type: 'price_update',
        details: `Price updated from ₹${existing.price.toFixed(2)} to ₹${Number(updates.price).toFixed(2)}`,
        performed_by: existing.verified_by || 'Pharmacist',
        timestamp: 'Just now'
      });
    }

    if (updates.status && updates.status !== existing.status) {
      InventoryService.addHistoryLog({
        pharmacy_id: existing.pharmacy_id,
        medicine_id: existing.medicine_id,
        medicine_name: existing.medicine?.name || existing.custom_name || 'Medicine',
        strength: existing.strength,
        change_type: 'status_change',
        details: `Status changed to ${updates.status.replace('_', ' ').toUpperCase()}`,
        performed_by: existing.verified_by || 'Pharmacist',
        timestamp: 'Just now'
      });
    }

    return updatedItem;
  },

  // Edit complete medicine item details (Name, Strength, Dosage Form, Price, Qty, etc.)
  editInventoryItem: async (
    id: string,
    updates: Partial<InventoryItem>
  ): Promise<InventoryItem | null> => {
    const current = typeof window !== 'undefined' 
      ? getStoredData<InventoryItem[]>(INVENTORY_STORAGE_KEY, memoryInventory) 
      : memoryInventory;

    const index = current.findIndex(i => i.id === id);
    if (index === -1) return null;

    const existing = current[index];
    const updatedItem: InventoryItem = {
      ...existing,
      ...updates,
      last_updated: 'Just now',
      last_verified_at: 'Just now',
      verification_timestamp: Date.now(),
      is_recently_verified: true
    };

    current[index] = updatedItem;
    memoryInventory = current;
    setStoredData(INVENTORY_STORAGE_KEY, current);

    // Record history
    InventoryService.addHistoryLog({
      pharmacy_id: existing.pharmacy_id,
      medicine_id: existing.medicine_id,
      medicine_name: updatedItem.medicine?.name || updatedItem.custom_name || 'Medicine',
      strength: updatedItem.strength,
      change_type: 'medicine_edited',
      details: `Medicine information updated (${updatedItem.strength}, ${updatedItem.dosage_form}, Price: ₹${updatedItem.price})`,
      performed_by: updatedItem.verified_by || 'Pharmacist',
      timestamp: 'Just now'
    });

    return updatedItem;
  },

  // Update Pharmacy Profile
  updatePharmacyProfile: async (
    pharmacyId: string,
    updates: Partial<Pharmacy>
  ): Promise<Pharmacy | null> => {
    const current = typeof window !== 'undefined'
      ? getStoredData<Pharmacy[]>(PHARMACIES_STORAGE_KEY, memoryPharmacies)
      : memoryPharmacies;

    const index = current.findIndex(p => p.id === pharmacyId);
    if (index === -1) return null;

    const updatedPharm = {
      ...current[index],
      ...updates
    };

    current[index] = updatedPharm;
    memoryPharmacies = current;
    setStoredData(PHARMACIES_STORAGE_KEY, current);

    // Log update
    InventoryService.addHistoryLog({
      pharmacy_id: pharmacyId,
      medicine_name: 'Pharmacy Dispensary',
      strength: 'Profile',
      change_type: 'profile_update',
      details: 'Pharmacy profile & licensing information updated',
      performed_by: updatedPharm.owner_name,
      timestamp: 'Just now'
    });

    return updatedPharm;
  },

  // Verify Pharmacy License
  verifyPharmacy: async (pharmacyId: string, verified: boolean = true): Promise<Pharmacy | null> => {
    return InventoryService.updatePharmacyProfile(pharmacyId, { verified });
  },

  // Get Inventory History Logs
  getInventoryHistory: async (pharmacyId: string): Promise<InventoryHistoryLog[]> => {
    let logs = memoryHistory;
    if (typeof window !== 'undefined') {
      logs = getStoredData<InventoryHistoryLog[]>(HISTORY_STORAGE_KEY, memoryHistory);
    }
    return logs
      .filter(l => l.pharmacy_id === pharmacyId)
      .sort((a, b) => b.created_at - a.created_at);
  },

  // Add Inventory History Log
  addHistoryLog: async (
    logData: Omit<InventoryHistoryLog, 'id' | 'created_at'>
  ): Promise<InventoryHistoryLog> => {
    let current = memoryHistory;
    if (typeof window !== 'undefined') {
      current = getStoredData<InventoryHistoryLog[]>(HISTORY_STORAGE_KEY, memoryHistory);
    }

    const newLog: InventoryHistoryLog = {
      ...logData,
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      created_at: Date.now()
    };

    const updated = [newLog, ...current];
    memoryHistory = updated;
    setStoredData(HISTORY_STORAGE_KEY, updated);
    return newLog;
  },


  // Add new inventory item to pharmacy
  addInventoryItem: async (
    itemData: Omit<InventoryItem, 'id' | 'last_updated' | 'last_verified_at' | 'verification_timestamp' | 'is_recently_verified'>
  ): Promise<InventoryItem> => {
    const current = typeof window !== 'undefined' 
      ? getStoredData<InventoryItem[]>(INVENTORY_STORAGE_KEY, memoryInventory) 
      : memoryInventory;

    let status = itemData.status;
    if (itemData.quantity === 0) status = 'out_of_stock';
    else if (itemData.quantity < 10) status = 'low_stock';
    else if (!status) status = 'in_stock';

    const newItem: InventoryItem = {
      ...itemData,
      id: `inv-${Date.now()}`,
      status,
      last_updated: 'Just now',
      last_verified_at: 'Just now',
      verification_timestamp: Date.now(),
      verified_by: itemData.verified_by || 'Verified Pharmacist',
      is_recently_verified: true
    };

    const updated = [newItem, ...current];
    memoryInventory = updated;
    setStoredData(INVENTORY_STORAGE_KEY, updated);

    // Record history
    InventoryService.addHistoryLog({
      pharmacy_id: newItem.pharmacy_id,
      medicine_id: newItem.medicine_id,
      medicine_name: newItem.custom_name || 'New Medicine',
      strength: newItem.strength,
      change_type: 'medicine_added',
      details: `Added new medicine to catalog: ${newItem.quantity} units @ ₹${newItem.price.toFixed(2)}`,
      performed_by: newItem.verified_by || 'Pharmacist',
      timestamp: 'Just now'
    });

    return newItem;
  },

  // Find pharmacies stocking a specific medicine with optional filters
  searchPharmacyStockForMedicine: async (
    medicineId: string,
    options?: {
      userLat?: number;
      userLng?: number;
      strength?: string;
      inStockOnly?: boolean;
    }
  ): Promise<{
    pharmacy: Pharmacy;
    inventoryItem: InventoryItem;
    distance_km?: number;
  }[]> => {
    const inventory = await InventoryService.getInventory();
    const pharmacies = await InventoryService.getPharmacies();

    // Security Gate: Only verified pharmacies are permitted to publish stock
    const verifiedPharmacies = pharmacies.filter(p => p.verified === true);
    const verifiedIds = new Set(verifiedPharmacies.map(p => p.id));

    let matchingItems = inventory.filter(inv => inv.medicine_id === medicineId && verifiedIds.has(inv.pharmacy_id));

    if (options?.strength) {
      matchingItems = matchingItems.filter(
        i => i.strength.toLowerCase() === options.strength?.toLowerCase()
      );
    }

    if (options?.inStockOnly) {
      matchingItems = matchingItems.filter(
        i => i.status === 'in_stock' || i.status === 'low_stock'
      );
    }

    const results = matchingItems.map(item => {
      const pharmacy = pharmacies.find(p => p.id === item.pharmacy_id) || item.pharmacy!;
      let distance_km: number | undefined;

      if (options?.userLat && options?.userLng) {
        distance_km = calculateDistance(
          options.userLat,
          options.userLng,
          pharmacy.latitude,
          pharmacy.longitude
        );
      }

      return {
        pharmacy,
        inventoryItem: item,
        distance_km
      };
    });

    // Default sort by distance if user coords are present, else by availability
    if (options?.userLat && options?.userLng) {
      results.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
    } else {
      results.sort((a, b) => {
        const order: Record<AvailabilityStatus, number> = {
          in_stock: 0,
          low_stock: 1,
          unconfirmed: 2,
          out_of_stock: 3
        };
        return order[a.inventoryItem.status] - order[b.inventoryItem.status];
      });
    }

    return results;
  },

  // Multi-medicine match solver for prescriptions / multi-item search
  findPharmaciesForPrescription: async (
    extractedItems: PrescriptionExtractedItem[],
    userCoords?: { lat: number; lng: number }
  ): Promise<{
    fullMatches: PharmacyMatch[];
    partialMatches: PharmacyMatch[];
    allPharmaciesEvaluated: PharmacyMatch[];
  }> => {
    const inventory = await InventoryService.getInventory();
    const allPharmacies = await InventoryService.getPharmacies();
    // Security Gate: Only verified pharmacies may publish stock for prescription matches
    const pharmacies = allPharmacies.filter(p => p.verified === true);
    const medicines = await InventoryService.getMedicines();

    // Map extracted items to resolved medicine IDs if possible
    const resolvedItems = extractedItems.map(item => {
      if (item.matched_medicine_id) return item;
      const found = medicines.find(m => 
        m.name.toLowerCase() === item.detected_name.toLowerCase() ||
        m.generic_name.toLowerCase().includes(item.detected_name.toLowerCase()) ||
        m.brand_names.some(b => b.toLowerCase() === item.detected_name.toLowerCase())
      );
      return {
        ...item,
        matched_medicine_id: found?.id,
        matched_medicine: found
      };
    });

    const matches: PharmacyMatch[] = pharmacies.map(pharmacy => {
      const pharmInventory = inventory.filter(inv => inv.pharmacy_id === pharmacy.id);
      const matched_medicines: PharmacyMatch['matched_medicines'] = [];
      const missing_medicines: PrescriptionExtractedItem[] = [];
      let total_estimated_cost = 0;

      resolvedItems.forEach(prescItem => {
        // Find best match in this pharmacy
        const invMatch = pharmInventory.find(inv => {
          const matchMed = prescItem.matched_medicine_id 
            ? inv.medicine_id === prescItem.matched_medicine_id
            : inv.medicine?.name.toLowerCase() === prescItem.detected_name.toLowerCase();
          
          const matchStrength = !prescItem.strength || inv.strength.toLowerCase() === prescItem.strength.toLowerCase();
          const hasStock = inv.status === 'in_stock' || inv.status === 'low_stock';

          return matchMed && matchStrength && hasStock;
        }) || pharmInventory.find(inv => {
          // Fallback match without strength constraint if stock is available
          return (
            (prescItem.matched_medicine_id && inv.medicine_id === prescItem.matched_medicine_id) &&
            (inv.status === 'in_stock' || inv.status === 'low_stock')
          );
        });

        if (invMatch) {
          matched_medicines.push({
            item: prescItem,
            inventory: invMatch
          });
          total_estimated_cost += invMatch.price;
        } else {
          missing_medicines.push(prescItem);
        }
      });

      const totalItems = resolvedItems.length || 1;
      const match_percentage = Math.round((matched_medicines.length / totalItems) * 100);

      let distance_km: number | undefined;
      if (userCoords?.lat && userCoords?.lng) {
        distance_km = calculateDistance(
          userCoords.lat,
          userCoords.lng,
          pharmacy.latitude,
          pharmacy.longitude
        );
      }

      return {
        pharmacy,
        matched_medicines,
        missing_medicines,
        match_percentage,
        total_estimated_cost: parseFloat(total_estimated_cost.toFixed(2)),
        distance_km
      };
    });

    // Sort: highest match percentage first, then shortest distance
    matches.sort((a, b) => {
      if (b.match_percentage !== a.match_percentage) {
        return b.match_percentage - a.match_percentage;
      }
      return (a.distance_km || 999) - (b.distance_km || 999);
    });

    const fullMatches = matches.filter(m => m.match_percentage === 100);
    const partialMatches = matches.filter(m => m.match_percentage > 0 && m.match_percentage < 100);

    return {
      fullMatches,
      partialMatches,
      allPharmaciesEvaluated: matches
    };
  },

  // Enquiries
  getEnquiries: async (pharmacyId?: string): Promise<AvailabilityEnquiry[]> => {
    let list = memoryEnquiries;
    if (typeof window !== 'undefined') {
      list = getStoredData<AvailabilityEnquiry[]>(ENQUIRIES_STORAGE_KEY, memoryEnquiries);
    }
    if (pharmacyId) {
      return list.filter(e => e.pharmacy_id === pharmacyId);
    }
    return list;
  },

  createEnquiry: async (enquiry: Omit<AvailabilityEnquiry, 'id' | 'status' | 'created_at'>): Promise<AvailabilityEnquiry> => {
    const list = await InventoryService.getEnquiries();
    const newEnq: AvailabilityEnquiry = {
      ...enquiry,
      id: `enq-${Date.now()}`,
      status: 'pending',
      created_at: 'Just now'
    };
    const updated = [newEnq, ...list];
    memoryEnquiries = updated;
    setStoredData(ENQUIRIES_STORAGE_KEY, updated);
    return newEnq;
  },

  updateEnquiryStatus: async (enquiryId: string, status: AvailabilityEnquiry['status']): Promise<AvailabilityEnquiry | null> => {
    const list = await InventoryService.getEnquiries();
    const index = list.findIndex(e => e.id === enquiryId);
    if (index === -1) return null;

    list[index].status = status;
    memoryEnquiries = list;
    setStoredData(ENQUIRIES_STORAGE_KEY, list);
    return list[index];
  }
};
