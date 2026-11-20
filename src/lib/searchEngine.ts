import { 
  Medicine, 
  Pharmacy, 
  InventoryItem, 
  DosageForm, 
  AvailabilityStatus,
  SearchQueryItem,
  PharmacySearchResult,
  SearchSortOption
} from '@/types';
import { calculateDistance } from './inventoryService';

/**
 * Standard Levenshtein Distance for typo and spelling variation detection
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();

  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Normalized string similarity score between 0.0 and 1.0
 */
export function stringSimilarity(s1: string, s2: string): number {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();

  if (a === b) return 1.0;
  if (a.includes(b) || b.includes(a)) {
    return 0.9;
  }

  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;

  return Math.max(0, 1 - distance / maxLen);
}

// Known common pharmaceutical dosage forms for extraction
const DOSAGE_FORMS: { form: DosageForm; patterns: RegExp }[] = [
  { form: 'Tablet', patterns: /\b(?:tablets?|tabs?|tab)\b/i },
  { form: 'Capsule', patterns: /\b(?:capsules?|caps?|cap)\b/i },
  { form: 'Syrup', patterns: /\b(?:syrups?|syp|suspension|susp|liquid)\b/i },
  { form: 'Inhaler', patterns: /\b(?:inhalers?|rotacap|respules?|puff|spray)\b/i },
  { form: 'Injection', patterns: /\b(?:injections?|inj|vials?|ampoules?)\b/i },
  { form: 'Ointment', patterns: /\b(?:ointments?|cream|gel)\b/i },
  { form: 'Drops', patterns: /\b(?:drops?)\b/i },
  { form: 'Suspension', patterns: /\b(?:suspension)\b/i },
];

// Strength regex (e.g. 500mg, 650 mg, 100mcg, 20mg, 5ml, 10mg)
const STRENGTH_REGEX = /\b(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|units?))\b/i;

/**
 * Intelligent parser that extracts medicine name, strength, and dosage form from free-text
 */
export function parseSearchQuery(queryText: string): {
  cleanName: string;
  detectedStrength?: string;
  detectedForm?: DosageForm;
} {
  let text = queryText.trim();
  let detectedStrength: string | undefined;
  let detectedForm: DosageForm | undefined;

  // Extract strength
  const strengthMatch = text.match(STRENGTH_REGEX);
  if (strengthMatch) {
    detectedStrength = strengthMatch[1].replace(/\s+/g, '').toLowerCase();
    text = text.replace(strengthMatch[0], '').trim();
  }

  // Extract dosage form
  for (const item of DOSAGE_FORMS) {
    if (item.patterns.test(text)) {
      detectedForm = item.form;
      text = text.replace(item.patterns, '').trim();
      break;
    }
  }

  // Clean punctuation and hyphens
  const cleanName = text.replace(/[,;+]/g, ' ').replace(/\s+/g, ' ').trim();

  return {
    cleanName,
    detectedStrength,
    detectedForm
  };
}

export interface ScoredMedicine {
  medicine: Medicine;
  score: number;
  matchType: 'exact' | 'prefix' | 'generic' | 'brand' | 'fuzzy';
  matchedTerm: string;
}

/**
 * Finds medicines matching brand name, generic name, active ingredient, or spelling variations
 */
export function searchMedicinesCatalog(
  query: string,
  catalog: Medicine[],
  threshold = 0.55
): ScoredMedicine[] {
  const { cleanName } = parseSearchQuery(query);
  const q = cleanName.toLowerCase();

  if (!q) {
    return catalog.map(m => ({
      medicine: m,
      score: 1.0,
      matchType: 'exact',
      matchedTerm: m.name
    }));
  }

  const results: ScoredMedicine[] = [];

  for (const med of catalog) {
    const medName = med.name.toLowerCase();
    const genericName = med.generic_name.toLowerCase();
    const brandNames = med.brand_names.map(b => b.toLowerCase());

    let bestScore = 0;
    let matchType: ScoredMedicine['matchType'] = 'fuzzy';
    let matchedTerm = med.name;

    // 1. Exact match on brand or primary name
    if (medName === q) {
      bestScore = 1.0;
      matchType = 'exact';
      matchedTerm = med.name;
    } 
    // 2. Exact match on Generic Name / Active Ingredient
    else if (genericName === q || genericName.split(' ')[0] === q) {
      bestScore = 0.98;
      matchType = 'generic';
      matchedTerm = med.generic_name;
    }
    // 3. Exact match on Brand Names list
    else if (brandNames.includes(q)) {
      bestScore = 0.97;
      matchType = 'brand';
      matchedTerm = med.brand_names.find(b => b.toLowerCase() === q) || med.name;
    }
    // 4. Prefix or Substring match
    else if (medName.startsWith(q) || genericName.startsWith(q) || brandNames.some(b => b.startsWith(q))) {
      bestScore = 0.90;
      matchType = 'prefix';
      matchedTerm = med.name;
    } else if (medName.includes(q) || genericName.includes(q) || brandNames.some(b => b.includes(q))) {
      bestScore = 0.85;
      matchType = 'prefix';
      matchedTerm = med.name;
    } 
    // 5. Fuzzy spelling variation / typo match
    else {
      // Check distance against medName
      const nameSim = stringSimilarity(q, medName);
      // Check distance against generic words
      const genericWords = genericName.split(/[\s,]+/);
      const genericSim = Math.max(...genericWords.map(w => stringSimilarity(q, w)));
      // Check distance against brand names
      const brandSim = brandNames.length > 0 
        ? Math.max(...brandNames.map(b => stringSimilarity(q, b))) 
        : 0;

      const maxSim = Math.max(nameSim, genericSim, brandSim);

      if (maxSim >= threshold) {
        bestScore = maxSim;
        matchType = 'fuzzy';
        if (maxSim === brandSim) {
          matchedTerm = med.brand_names.find(b => stringSimilarity(q, b.toLowerCase()) >= threshold) || med.name;
        } else if (maxSim === genericSim) {
          matchedTerm = med.generic_name;
        } else {
          matchedTerm = med.name;
        }
      }
    }

    if (bestScore >= threshold) {
      results.push({
        medicine: med,
        score: bestScore,
        matchType,
        matchedTerm
      });
    }
  }

  // Sort highest score first
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Checks if an inventory item has been confirmed recently (within the last 24 hours)
 */
export function isStockRecentlyVerified(item: InventoryItem): boolean {
  // If explicitly flagged as recently verified
  if (item.is_recently_verified !== undefined) {
    return Boolean(item.is_recently_verified);
  }

  if (item.verification_timestamp) {
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    return (Date.now() - item.verification_timestamp) <= twentyFourHoursMs;
  }

  // Fallback to checking string timestamp
  const updated = (item.last_updated || item.last_verified_at || '').toLowerCase();
  return (
    updated.includes('min') || 
    updated.includes('hour') || 
    updated.includes('today') || 
    updated.includes('just now')
  );
}

/**
 * Multi-Medicine Pharmacy Search Engine
 * Prioritizes pharmacies that have ALL requested medicines.
 * Calculates user distance, verifies recency, enforces exact strengths/forms without substitution.
 */
export function searchPharmaciesForMedicines(
  queryItems: SearchQueryItem[],
  pharmacies: Pharmacy[],
  inventory: InventoryItem[],
  medicinesCatalog: Medicine[],
  userCoords: { latitude: number; longitude: number },
  sortBy: SearchSortOption = 'nearest'
): {
  allPharmacies: PharmacySearchResult[];
  completeMatches: PharmacySearchResult[];
  partialMatches: PharmacySearchResult[];
} {
  // Security Gate: Only verified pharmacies are permitted to publish stock availability
  const verifiedPharmacies = pharmacies.filter(p => p.verified === true);

  const results: PharmacySearchResult[] = verifiedPharmacies.map(pharmacy => {
    const pharmInventory = inventory.filter(inv => inv.pharmacy_id === pharmacy.id);
    const distance_km = calculateDistance(
      userCoords.latitude,
      userCoords.longitude,
      pharmacy.latitude,
      pharmacy.longitude
    );

    const matched_items: PharmacySearchResult['matched_items'] = [];
    const unmatched_items: SearchQueryItem[] = [];
    let totalPrice = 0;
    let latestVerification = 'Unconfirmed';

    for (const qItem of queryItems) {
      // Find candidate medicine in catalog
      const matchedMed = medicinesCatalog.find(m => 
        (qItem.matched_medicine_id && m.id === qItem.matched_medicine_id) ||
        m.name.toLowerCase() === qItem.name.toLowerCase() ||
        m.generic_name.toLowerCase().includes(qItem.name.toLowerCase()) ||
        m.brand_names.some(b => b.toLowerCase() === qItem.name.toLowerCase())
      );

      // Look for exact inventory match in this pharmacy
      // CRITICAL RULE: Never change or substitute prescribed strengths or dosage forms!
      const invMatch = pharmInventory.find(inv => {
        const medIdMatches = matchedMed ? inv.medicine_id === matchedMed.id : false;
        const nameMatches = inv.medicine?.name.toLowerCase() === qItem.name.toLowerCase() ||
                            inv.medicine?.generic_name.toLowerCase().includes(qItem.name.toLowerCase());
        
        const isMed = medIdMatches || nameMatches;
        
        // Exact strength match (if specified)
        const isStrength = !qItem.strength || 
          inv.strength.toLowerCase().replace(/\s+/g, '') === qItem.strength.toLowerCase().replace(/\s+/g, '');
        
        // Exact dosage form match (if specified)
        const isForm = !qItem.dosage_form || 
          inv.dosage_form.toLowerCase() === qItem.dosage_form.toLowerCase();

        return isMed && isStrength && isForm;
      });

      if (invMatch) {
        const medObj = matchedMed || invMatch.medicine || medicinesCatalog[0];
        const isRecentlyVerified = isStockRecentlyVerified(invMatch);

        // Effective status rule:
        // A medicine should ONLY show as available when the pharmacy has confirmed its inventory recently!
        let effectiveStatus: AvailabilityStatus = invMatch.status;
        if (!isRecentlyVerified && (invMatch.status === 'in_stock' || invMatch.status === 'low_stock')) {
          effectiveStatus = 'unconfirmed';
        }

        const isAvailable = (effectiveStatus === 'in_stock' || effectiveStatus === 'low_stock');

        if (invMatch.last_verified_at) {
          latestVerification = invMatch.last_verified_at;
        }

        if (isAvailable) {
          totalPrice += invMatch.price;
        }

        matched_items.push({
          queryItem: qItem,
          inventoryItem: invMatch,
          medicine: medObj,
          is_available: isAvailable,
          effective_status: effectiveStatus
        });
      } else {
        unmatched_items.push(qItem);
      }
    }

    const availableCount = matched_items.filter(m => m.is_available).length;
    const totalQueried = queryItems.length || 1;
    const matchPercentage = Math.round((availableCount / totalQueried) * 100);
    const hasAll = availableCount === totalQueried && totalQueried > 0;

    return {
      pharmacy,
      distance_km,
      matched_items,
      unmatched_items,
      available_count: availableCount,
      total_queried: totalQueried,
      match_percentage: matchPercentage,
      has_all_medicines: hasAll,
      total_price: parseFloat(totalPrice.toFixed(2)),
      latest_verification_text: latestVerification
    };
  });

  // Apply Sorting
  results.sort((a, b) => {
    // Complete matches always bubble to top when multiple medicines are searched
    if (queryItems.length > 1) {
      if (a.has_all_medicines && !b.has_all_medicines) return -1;
      if (!a.has_all_medicines && b.has_all_medicines) return 1;
    }

    if (sortBy === 'nearest') {
      return a.distance_km - b.distance_km;
    }
    if (sortBy === 'most_available') {
      if (b.available_count !== a.available_count) {
        return b.available_count - a.available_count;
      }
      return a.distance_km - b.distance_km;
    }
    if (sortBy === 'lowest_price') {
      if (a.total_price !== b.total_price) {
        return a.total_price - b.total_price;
      }
      return a.distance_km - b.distance_km;
    }
    return a.distance_km - b.distance_km;
  });

  const completeMatches = results.filter(r => r.has_all_medicines);
  const partialMatches = results.filter(r => !r.has_all_medicines && r.available_count > 0);

  return {
    allPharmacies: results,
    completeMatches,
    partialMatches
  };
}
