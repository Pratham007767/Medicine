import { Medicine, Pharmacy, InventoryItem, AvailabilityEnquiry } from '@/types';

export const INITIAL_MEDICINES: Medicine[] = [
  {
    id: "med-1",
    name: "Amoxicillin",
    generic_name: "Amoxicillin Trihydrate",
    brand_names: ["Amoxil", "Moxatag", "Trimox"],
    category: "Antibiotics",
    dosage_form: "Capsule",
    strengths: ["250mg", "500mg", "875mg"],
    description: "Broad-spectrum penicillin antibiotic used to treat bacterial infections of the ear, nose, throat, chest, and urinary tract.",
    prescription_required: true,
    common_uses: ["Bacterial infections", "Ear infection", "Pneumonia", "Strep throat"]
  },
  {
    id: "med-2",
    name: "Augmentin",
    generic_name: "Amoxicillin and Clavulanate Potassium",
    brand_names: ["Augmentin", "Augmentin XR", "Clavam"],
    category: "Antibiotics",
    dosage_form: "Tablet",
    strengths: ["375mg", "625mg", "1000mg"],
    description: "Combination antibiotic used to treat sinusitis, pneumonia, ear infections, bronchitis, and skin infections.",
    prescription_required: true,
    common_uses: ["Sinusitis", "Respiratory tract infections", "Skin infections"]
  },
  {
    id: "med-3",
    name: "Paracetamol",
    generic_name: "Acetaminophen",
    brand_names: ["Tylenol", "Panadol", "Calpol", "Crocin"],
    category: "Analgesic & Antipyretic",
    dosage_form: "Tablet",
    strengths: ["325mg", "500mg", "650mg"],
    description: "Effective fever reducer and mild-to-moderate pain reliever.",
    prescription_required: false,
    common_uses: ["Fever", "Headache", "Body ache", "Mild arthritis"]
  },
  {
    id: "med-4",
    name: "Metformin HCl",
    generic_name: "Metformin Hydrochloride",
    brand_names: ["Glucophage", "Fortamet", "Glumetza"],
    category: "Antidiabetic",
    dosage_form: "Tablet",
    strengths: ["500mg", "850mg", "1000mg"],
    description: "First-line medication for the treatment of type 2 diabetes mellitus, particularly in people who are overweight.",
    prescription_required: true,
    common_uses: ["Type 2 Diabetes", "Blood sugar management", "PCOS"]
  },
  {
    id: "med-5",
    name: "Atorvastatin",
    generic_name: "Atorvastatin Calcium",
    brand_names: ["Lipitor", "Atorva", "Storvas"],
    category: "Cardiovascular / Statin",
    dosage_form: "Tablet",
    strengths: ["10mg", "20mg", "40mg", "80mg"],
    description: "HMG-CoA reductase inhibitor used to lower blood cholesterol and decrease risk of cardiovascular disease.",
    prescription_required: true,
    common_uses: ["High cholesterol", "Cardiovascular disease prevention", "Atherosclerosis"]
  },
  {
    id: "med-6",
    name: "Azithromycin",
    generic_name: "Azithromycin Dihydrate",
    brand_names: ["Zithromax", "Z-Pak", "Azee"],
    category: "Antibiotics (Macrolide)",
    dosage_form: "Tablet",
    strengths: ["250mg", "500mg"],
    description: "Macrolide antibiotic used for respiratory, skin, ear, and sexually transmitted infections.",
    prescription_required: true,
    common_uses: ["Bronchitis", "Pneumonia", "Tonsillitis", "Chlamydia"]
  },
  {
    id: "med-7",
    name: "Omeprazole",
    generic_name: "Omeprazole",
    brand_names: ["Prilosec", "Omez", "Losec"],
    category: "Gastrointestinal (PPI)",
    dosage_form: "Capsule",
    strengths: ["20mg", "40mg"],
    description: "Proton pump inhibitor that reduces stomach acid production, treating GERD and peptic ulcers.",
    prescription_required: false,
    common_uses: ["Acid reflux / GERD", "Heartburn", "Stomach ulcer"]
  },
  {
    id: "med-8",
    name: "Losartan Potassium",
    generic_name: "Losartan",
    brand_names: ["Cozaar", "Losacar", "Repace"],
    category: "Cardiovascular (ARB)",
    dosage_form: "Tablet",
    strengths: ["25mg", "50mg", "100mg"],
    description: "Angiotensin II receptor blocker used to treat high blood pressure and protect kidneys in diabetes.",
    prescription_required: true,
    common_uses: ["Hypertension", "Diabetic nephropathy", "Stroke reduction"]
  },
  {
    id: "med-9",
    name: "Salbutamol Inhaler",
    generic_name: "Albuterol / Salbutamol",
    brand_names: ["Ventolin", "ProAir", "Asthalin"],
    category: "Respiratory",
    dosage_form: "Inhaler",
    strengths: ["100mcg", "90mcg"],
    description: "Fast-acting bronchodilator for rapid relief of asthma attacks, bronchospasms, and COPD wheezing.",
    prescription_required: true,
    common_uses: ["Asthma", "Acute wheezing", "COPD relief", "Exercise-induced bronchospasm"]
  },
  {
    id: "med-10",
    name: "Ibuprofen",
    generic_name: "Ibuprofen",
    brand_names: ["Advil", "Motrin", "Brufen"],
    category: "NSAID",
    dosage_form: "Tablet",
    strengths: ["200mg", "400mg", "600mg"],
    description: "Nonsteroidal anti-inflammatory drug used for relieving pain, helping with fever, and reducing inflammation.",
    prescription_required: false,
    common_uses: ["Inflammation", "Muscle ache", "Dental pain", "Fever"]
  },
  {
    id: "med-11",
    name: "Cetirizine HCl",
    generic_name: "Cetirizine",
    brand_names: ["Zyrtec", "Cetzine", "Alerid"],
    category: "Antihistamine",
    dosage_form: "Tablet",
    strengths: ["5mg", "10mg"],
    description: "Second-generation antihistamine used to relieve allergy symptoms such as watery eyes, runny nose, and hives.",
    prescription_required: false,
    common_uses: ["Seasonal allergies", "Hay fever", "Hives", "Itching"]
  },
  {
    id: "med-12",
    name: "Pantoprazole",
    generic_name: "Pantoprazole Sodium",
    brand_names: ["Protonix", "Pantocid", "Pan 40"],
    category: "Gastrointestinal (PPI)",
    dosage_form: "Tablet",
    strengths: ["20mg", "40mg"],
    description: "Proton pump inhibitor that decreases the amount of acid produced in the stomach.",
    prescription_required: true,
    common_uses: ["Erosive esophagitis", "GERD", "Gastric ulcers"]
  },
  {
    id: "med-13",
    name: "Amlodipine",
    generic_name: "Amlodipine Besylate",
    brand_names: ["Norvasc", "Amlong", "Stamlo"],
    category: "Cardiovascular (CCB)",
    dosage_form: "Tablet",
    strengths: ["2.5mg", "5mg", "10mg"],
    description: "Calcium channel blocker used to lower blood pressure and prevent angina (chest pain).",
    prescription_required: true,
    common_uses: ["High blood pressure", "Coronary artery disease", "Angina"]
  },
  {
    id: "med-14",
    name: "Montelukast",
    generic_name: "Montelukast Sodium",
    brand_names: ["Singulair", "Montair", "Telekast"],
    category: "Respiratory",
    dosage_form: "Tablet",
    strengths: ["4mg", "5mg", "10mg"],
    description: "Leukotriene receptor antagonist used for maintenance treatment of asthma and relief of allergic rhinitis.",
    prescription_required: true,
    common_uses: ["Asthma prevention", "Allergic rhinitis", "Bronchoconstriction"]
  },
  {
    id: "med-15",
    name: "Ciprofloxacin",
    generic_name: "Ciprofloxacin HCl",
    brand_names: ["Cipro", "Ciplox", "Ciproxin"],
    category: "Antibiotics (Fluoroquinolone)",
    dosage_form: "Tablet",
    strengths: ["250mg", "500mg", "750mg"],
    description: "Fluoroquinolone antibiotic used for severe bacterial infections, complicated UTIs, and abdominal infections.",
    prescription_required: true,
    common_uses: ["Urinary tract infections", "Bone and joint infections", "Typhoid fever"]
  }
];

export const INITIAL_PHARMACIES: Pharmacy[] = [
  {
    id: "pharm-1",
    name: "Apollo Pharmacy - Jalukbari (GU Gate)",
    license_number: "AS-KAM-89421",
    owner_name: "Dr. Evelyn Reed, PharmD",
    email: "evelyn@careplusmetro.com",
    phone: "+91 361 257 0143",
    address: "Near Gauhati University Gate No. 1, Jalukbari",
    city: "Guwahati",
    state: "Assam",
    postal_code: "781014",
    latitude: 26.1510,
    longitude: 91.6635,
    rating: 4.8,
    opening_hours: "Mon-Sat: 7:30 AM - 10:30 PM, Sun: 8:00 AM - 8:00 PM",
    verified: true,
    is_demo_data: true
  },
  {
    id: "pharm-2",
    name: "Sanjeevani Medicos - Gauhati University",
    license_number: "AS-KAM-77209",
    owner_name: "Marcus Vance, RPh",
    email: "manager@apexhealthchemist.com",
    phone: "+91 98640 55199",
    address: "Opp. BKB Hall, Gauhati University Campus Road, Jalukbari",
    city: "Guwahati",
    state: "Assam",
    postal_code: "781014",
    latitude: 26.1565,
    longitude: 91.6600,
    rating: 4.9,
    opening_hours: "Open 24 Hours / 7 Days",
    verified: true,
    is_demo_data: true
  },
  {
    id: "pharm-3",
    name: "HealthPlus 24x7 Chemist - Maligaon",
    license_number: "AS-KAM-61234",
    owner_name: "Sarah Jenkins, PharmD",
    email: "info@greencrosschem.org",
    phone: "+91 361 257 0182",
    address: "Maligaon Chariali, Near Kamakhya Railway Station",
    city: "Guwahati",
    state: "Assam",
    postal_code: "781011",
    latitude: 26.1585,
    longitude: 91.6920,
    rating: 4.7,
    opening_hours: "Mon-Fri: 8:00 AM - 10:00 PM, Sat: 8:00 AM - 8:00 PM",
    verified: true,
    is_demo_data: true
  },
  {
    id: "pharm-4",
    name: "Pratiksha Medistore - Jalukbari Point",
    license_number: "AS-KAM-90231",
    owner_name: "David Kim, PharmD",
    email: "dispensary@stjudemeds.org",
    phone: "+91 98640 22165",
    address: "Jalukbari Rotary & Flyover Junction",
    city: "Guwahati",
    state: "Assam",
    postal_code: "781014",
    latitude: 26.1480,
    longitude: 91.6670,
    rating: 4.6,
    opening_hours: "Daily: 7:00 AM - 11:00 PM",
    verified: true,
    is_demo_data: true
  },
  {
    id: "pharm-5",
    name: "Kamakhya Foothills Medical Hall",
    license_number: "AS-KAM-44810",
    owner_name: "Elena Rostova, RPh",
    email: "contact@guardianpharm.com",
    phone: "+91 361 255 0177",
    address: "Kamakhya Gate, Pandu Port Road",
    city: "Guwahati",
    state: "Assam",
    postal_code: "781012",
    latitude: 26.1630,
    longitude: 91.7100,
    rating: 4.5,
    opening_hours: "Mon-Sat: 8:30 AM - 9:00 PM, Sun: 9:00 AM - 5:00 PM",
    verified: true,
    is_demo_data: true
  },
  {
    id: "pharm-6",
    name: "Guwahati City Chemist - Bharalumukh",
    license_number: "AS-KAM-33291",
    owner_name: "James Wilson, PharmD",
    email: "orders@quickcureexpress.com",
    phone: "+91 98641 55128",
    address: "MG Road, Riverside, Bharalumukh",
    city: "Guwahati",
    state: "Assam",
    postal_code: "781009",
    latitude: 26.1720,
    longitude: 91.7280,
    rating: 4.4,
    opening_hours: "Mon-Sat: 8:00 AM - 9:30 PM",
    verified: true,
    is_demo_data: true
  },
  {
    id: "pharm-7",
    name: "LifeCare Druggist & Surgical - Panbazar",
    license_number: "AS-KAM-58902",
    owner_name: "Priya Patel, PharmD",
    email: "inventory@lifelinesuperchemist.com",
    phone: "+91 361 254 0155",
    address: "HB Road, Near Cotton University, Panbazar",
    city: "Guwahati",
    state: "Assam",
    postal_code: "781001",
    latitude: 26.1850,
    longitude: 91.7450,
    rating: 4.8,
    opening_hours: "Daily: 8:00 AM - 10:30 PM",
    verified: true,
    is_demo_data: true
  },
  {
    id: "pharm-8",
    name: "Dispur Super Care Pharmacy",
    license_number: "AS-KAM-19042",
    owner_name: "Robert Langdon, RPh",
    email: "service@beaconhillrx.com",
    phone: "+91 361 226 0112",
    address: "GS Road, Dispur Secretariat Complex",
    city: "Guwahati",
    state: "Assam",
    postal_code: "781006",
    latitude: 26.1420,
    longitude: 91.7900,
    rating: 4.7,
    opening_hours: "Mon-Fri: 8:30 AM - 10:00 PM, Sat: 8:30 AM - 8:00 PM",
    verified: true,
    is_demo_data: true
  },
  {
    id: "pharm-9",
    name: "Jalukbari West Medico (Pending Verification)",
    license_number: "AS-KAM-99102-PENDING",
    owner_name: "Dr. Arthur Pendelton, RPh",
    email: "arthur@newtowndispensary.com",
    phone: "+91 98642 55188",
    address: "NH-27 Bypass, Jalukbari West",
    city: "Guwahati",
    state: "Assam",
    postal_code: "781014",
    latitude: 26.1490,
    longitude: 91.6550,
    rating: 4.2,
    opening_hours: "Mon-Fri: 9:00 AM - 6:00 PM",
    verified: false, // Explicitly unverified to test verification enforcement
    is_demo_data: true
  }
];

// Helper to generate simulated inventory
// Helper timestamps
const NOW = Date.now();
const HOUR = 3600000;

export const INITIAL_INVENTORY: InventoryItem[] = [
  // CarePlus Metro Pharmacy (pharm-1)
  {
    id: "inv-1",
    pharmacy_id: "pharm-1",
    medicine_id: "med-1", // Amoxicillin 500mg
    strength: "500mg",
    dosage_form: "Capsule",
    quantity: 120,
    price: 99.50,
    status: "in_stock",
    last_updated: "25 mins ago",
    last_verified_at: "Today at 2:30 PM",
    verification_timestamp: NOW - (25 * 60 * 1000),
    verified_by: "Dr. Evelyn Reed, PharmD",
    is_recently_verified: true,
    batch_number: "AMX-882"
  },
  {
    id: "inv-2",
    pharmacy_id: "pharm-1",
    medicine_id: "med-3", // Paracetamol 650mg
    strength: "650mg",
    dosage_form: "Tablet",
    quantity: 350,
    price: 39.20,
    status: "in_stock",
    last_updated: "10 mins ago",
    last_verified_at: "Today at 2:45 PM",
    verification_timestamp: NOW - (10 * 60 * 1000),
    verified_by: "Dr. Evelyn Reed, PharmD",
    is_recently_verified: true,
    batch_number: "PCM-104"
  },
  {
    id: "inv-3",
    pharmacy_id: "pharm-1",
    medicine_id: "med-4", // Metformin 500mg
    strength: "500mg",
    dosage_form: "Tablet",
    quantity: 85,
    price: 57.00,
    status: "in_stock",
    last_updated: "1 hour ago",
    last_verified_at: "Today at 1:45 PM",
    verification_timestamp: NOW - (60 * 60 * 1000),
    verified_by: "Dr. Evelyn Reed, PharmD",
    is_recently_verified: true,
    batch_number: "MTF-301"
  },
  {
    id: "inv-4",
    pharmacy_id: "pharm-1",
    medicine_id: "med-5", // Atorvastatin 20mg
    strength: "20mg",
    dosage_form: "Tablet",
    quantity: 6,
    price: 149.00,
    status: "low_stock",
    last_updated: "2 hours ago",
    last_verified_at: "Today at 12:45 PM",
    verification_timestamp: NOW - (2 * HOUR),
    verified_by: "Dr. Evelyn Reed, PharmD",
    is_recently_verified: true,
    batch_number: "ATV-509"
  },
  {
    id: "inv-5",
    pharmacy_id: "pharm-1",
    medicine_id: "med-9", // Salbutamol Inhaler
    strength: "100mcg",
    dosage_form: "Inhaler",
    quantity: 0,
    price: 167.50,
    status: "out_of_stock",
    last_updated: "4 hours ago",
    last_verified_at: "Today at 10:30 AM",
    verification_timestamp: NOW - (4 * HOUR),
    verified_by: "Dr. Evelyn Reed, PharmD",
    is_recently_verified: true
  },
  {
    id: "inv-6",
    pharmacy_id: "pharm-1",
    medicine_id: "med-7", // Omeprazole 20mg
    strength: "20mg",
    dosage_form: "Capsule",
    quantity: 45,
    price: 83.80,
    status: "in_stock",
    last_updated: "30 mins ago",
    last_verified_at: "Today at 2:20 PM",
    verification_timestamp: NOW - (30 * 60 * 1000),
    verified_by: "Dr. Evelyn Reed, PharmD",
    is_recently_verified: true
  },

  // Apex 24/7 Health Chemist (pharm-2) - Has almost everything in stock!
  {
    id: "inv-7",
    pharmacy_id: "pharm-2",
    medicine_id: "med-1", // Amoxicillin 500mg
    strength: "500mg",
    dosage_form: "Capsule",
    quantity: 240,
    price: 95.00,
    status: "in_stock",
    last_updated: "5 mins ago",
    last_verified_at: "Today at 3:10 PM",
    verification_timestamp: NOW - (5 * 60 * 1000),
    verified_by: "Marcus Vance, RPh",
    is_recently_verified: true
  },
  {
    id: "inv-8",
    pharmacy_id: "pharm-2",
    medicine_id: "med-2", // Augmentin 625mg
    strength: "625mg",
    dosage_form: "Tablet",
    quantity: 110,
    price: 213.50,
    status: "in_stock",
    last_updated: "15 mins ago",
    last_verified_at: "Today at 3:00 PM",
    verification_timestamp: NOW - (15 * 60 * 1000),
    verified_by: "Marcus Vance, RPh",
    is_recently_verified: true
  },
  {
    id: "inv-9",
    pharmacy_id: "pharm-2",
    medicine_id: "med-3", // Paracetamol 650mg
    strength: "650mg",
    dosage_form: "Tablet",
    quantity: 500,
    price: 38.90,
    status: "in_stock",
    last_updated: "10 mins ago",
    last_verified_at: "Today at 3:05 PM",
    verification_timestamp: NOW - (10 * 60 * 1000),
    verified_by: "Marcus Vance, RPh",
    is_recently_verified: true
  },
  {
    id: "inv-10",
    pharmacy_id: "pharm-2",
    medicine_id: "med-4", // Metformin 500mg
    strength: "500mg",
    dosage_form: "Tablet",
    quantity: 140,
    price: 56.50,
    status: "in_stock",
    last_updated: "25 mins ago",
    last_verified_at: "Today at 2:50 PM",
    verification_timestamp: NOW - (25 * 60 * 1000),
    verified_by: "Marcus Vance, RPh",
    is_recently_verified: true
  },
  {
    id: "inv-11",
    pharmacy_id: "pharm-2",
    medicine_id: "med-5", // Atorvastatin 20mg
    strength: "20mg",
    dosage_form: "Tablet",
    quantity: 90,
    price: 147.00,
    status: "in_stock",
    last_updated: "1 hour ago",
    last_verified_at: "Today at 2:10 PM",
    verification_timestamp: NOW - HOUR,
    verified_by: "Marcus Vance, RPh",
    is_recently_verified: true
  },
  {
    id: "inv-12",
    pharmacy_id: "pharm-2",
    medicine_id: "med-6", // Azithromycin 500mg
    strength: "500mg",
    dosage_form: "Tablet",
    quantity: 75,
    price: 116.00,
    status: "in_stock",
    last_updated: "40 mins ago",
    last_verified_at: "Today at 2:35 PM",
    verification_timestamp: NOW - (40 * 60 * 1000),
    verified_by: "Marcus Vance, RPh",
    is_recently_verified: true
  },
  {
    id: "inv-13",
    pharmacy_id: "pharm-2",
    medicine_id: "med-9", // Salbutamol Inhaler
    strength: "100mcg",
    dosage_form: "Inhaler",
    quantity: 35,
    price: 169.00,
    status: "in_stock",
    last_updated: "2 hours ago",
    last_verified_at: "Today at 1:15 PM",
    verification_timestamp: NOW - (2 * HOUR),
    verified_by: "Marcus Vance, RPh",
    is_recently_verified: true
  },
  {
    id: "inv-14",
    pharmacy_id: "pharm-2",
    medicine_id: "med-11", // Cetirizine 10mg
    strength: "10mg",
    dosage_form: "Tablet",
    quantity: 210,
    price: 35.50,
    status: "in_stock",
    last_updated: "15 mins ago",
    last_verified_at: "Today at 3:00 PM",
    verification_timestamp: NOW - (15 * 60 * 1000),
    verified_by: "Marcus Vance, RPh",
    is_recently_verified: true
  },

  // GreenCross Community Pharmacy (pharm-3)
  {
    id: "inv-15",
    pharmacy_id: "pharm-3",
    medicine_id: "med-1",
    strength: "500mg",
    dosage_form: "Capsule",
    quantity: 8,
    price: 98.90,
    status: "low_stock",
    last_updated: "3 hours ago",
    last_verified_at: "Today at 12:15 PM",
    verification_timestamp: NOW - (3 * HOUR),
    verified_by: "Sarah Jenkins, PharmD",
    is_recently_verified: true
  },
  {
    id: "inv-16",
    pharmacy_id: "pharm-3",
    medicine_id: "med-3",
    strength: "650mg",
    dosage_form: "Tablet",
    quantity: 90,
    price: 39.00,
    status: "in_stock",
    last_updated: "1 hour ago",
    last_verified_at: "Today at 2:05 PM",
    verification_timestamp: NOW - HOUR,
    verified_by: "Sarah Jenkins, PharmD",
    is_recently_verified: true
  },
  {
    id: "inv-17",
    pharmacy_id: "pharm-3",
    medicine_id: "med-7",
    strength: "20mg",
    dosage_form: "Capsule",
    quantity: 0,
    price: 84.00,
    status: "out_of_stock",
    last_updated: "6 hours ago",
    last_verified_at: "Today at 9:00 AM",
    verification_timestamp: NOW - (6 * HOUR),
    verified_by: "Sarah Jenkins, PharmD",
    is_recently_verified: true
  },
  {
    id: "inv-18",
    pharmacy_id: "pharm-3",
    medicine_id: "med-8", // Losartan 50mg
    strength: "50mg",
    dosage_form: "Tablet",
    quantity: 60,
    price: 81.20,
    status: "in_stock",
    last_updated: "2 hours ago",
    last_verified_at: "Today at 1:15 PM",
    verification_timestamp: NOW - (2 * HOUR),
    verified_by: "Sarah Jenkins, PharmD",
    is_recently_verified: true
  },

  // St. Jude Hospital Adjacent Meds (pharm-4)
  {
    id: "inv-19",
    pharmacy_id: "pharm-4",
    medicine_id: "med-1",
    strength: "500mg",
    dosage_form: "Capsule",
    quantity: 300,
    price: 99.00,
    status: "in_stock",
    last_updated: "10 mins ago",
    last_verified_at: "Today at 3:00 PM",
    verification_timestamp: NOW - (10 * 60 * 1000),
    verified_by: "David Kim, PharmD",
    is_recently_verified: true
  },
  {
    id: "inv-20",
    pharmacy_id: "pharm-4",
    medicine_id: "med-2",
    strength: "625mg",
    dosage_form: "Tablet",
    quantity: 80,
    price: 212.00,
    status: "in_stock",
    last_updated: "15 mins ago",
    last_verified_at: "Today at 2:55 PM",
    verification_timestamp: NOW - (15 * 60 * 1000),
    verified_by: "David Kim, PharmD",
    is_recently_verified: true
  },
  {
    id: "inv-21",
    pharmacy_id: "pharm-4",
    medicine_id: "med-4",
    strength: "500mg",
    dosage_form: "Tablet",
    quantity: 0,
    price: 56.00,
    status: "out_of_stock",
    last_updated: "5 hours ago",
    last_verified_at: "Today at 10:15 AM",
    verification_timestamp: NOW - (5 * HOUR),
    verified_by: "David Kim, PharmD",
    is_recently_verified: true
  },
  {
    id: "inv-22",
    pharmacy_id: "pharm-4",
    medicine_id: "med-5",
    strength: "20mg",
    dosage_form: "Tablet",
    quantity: 45,
    price: 148.50,
    status: "in_stock",
    last_updated: "1 hour ago",
    last_verified_at: "Today at 2:15 PM",
    verification_timestamp: NOW - HOUR,
    verified_by: "David Kim, PharmD",
    is_recently_verified: true
  },
  {
    id: "inv-23",
    pharmacy_id: "pharm-4",
    medicine_id: "med-9",
    strength: "100mcg",
    dosage_form: "Inhaler",
    quantity: 12,
    price: 166.00,
    status: "in_stock",
    last_updated: "30 mins ago",
    last_verified_at: "Today at 2:40 PM",
    verification_timestamp: NOW - (30 * 60 * 1000),
    verified_by: "David Kim, PharmD",
    is_recently_verified: true
  },

  // Guardian Family Pharmacy (pharm-5) - Contains unverified items to test recency rule
  {
    id: "inv-24",
    pharmacy_id: "pharm-5",
    medicine_id: "med-3",
    strength: "500mg",
    dosage_form: "Tablet",
    quantity: 40,
    price: 38.50,
    status: "in_stock",
    last_updated: "2 hours ago",
    last_verified_at: "Today at 1:20 PM",
    verification_timestamp: NOW - (2 * HOUR),
    verified_by: "Elena Rostova, RPh",
    is_recently_verified: true
  },
  {
    id: "inv-25",
    pharmacy_id: "pharm-5",
    medicine_id: "med-10", // Ibuprofen 400mg
    strength: "400mg",
    dosage_form: "Tablet",
    quantity: 80,
    price: 44.20,
    status: "in_stock",
    last_updated: "45 mins ago",
    last_verified_at: "Today at 2:30 PM",
    verification_timestamp: NOW - (45 * 60 * 1000),
    verified_by: "Elena Rostova, RPh",
    is_recently_verified: true
  },
  {
    id: "inv-26",
    pharmacy_id: "pharm-5",
    medicine_id: "med-11",
    strength: "10mg",
    dosage_form: "Tablet",
    quantity: 5,
    price: 36.00,
    status: "low_stock",
    last_updated: "1 hour ago",
    last_verified_at: "Today at 2:10 PM",
    verification_timestamp: NOW - HOUR,
    verified_by: "Elena Rostova, RPh",
    is_recently_verified: true
  },
  {
    id: "inv-27",
    pharmacy_id: "pharm-5",
    medicine_id: "med-1", // Amoxicillin 500mg - Stale inventory (3 days ago)
    strength: "500mg",
    dosage_form: "Capsule",
    quantity: 15,
    price: 95.20,
    status: "unconfirmed",
    last_updated: "3 days ago",
    last_verified_at: "3 days ago (Nov 17)",
    verification_timestamp: NOW - (72 * HOUR),
    verified_by: "Unassigned",
    is_recently_verified: false
  },

  // QuickCure Express Dispensary (pharm-6)
  {
    id: "inv-28",
    pharmacy_id: "pharm-6",
    medicine_id: "med-1",
    strength: "500mg",
    dosage_form: "Capsule",
    quantity: 50,
    price: 96.00,
    status: "in_stock",
    last_updated: "1 hour ago",
    last_verified_at: "Today at 2:15 PM",
    verification_timestamp: NOW - HOUR,
    verified_by: "James Wilson, PharmD",
    is_recently_verified: true
  },
  {
    id: "inv-29",
    pharmacy_id: "pharm-6",
    medicine_id: "med-6",
    strength: "500mg",
    dosage_form: "Tablet",
    quantity: 15,
    price: 117.50,
    status: "in_stock",
    last_updated: "3 hours ago",
    last_verified_at: "Today at 12:30 PM",
    verification_timestamp: NOW - (3 * HOUR),
    verified_by: "James Wilson, PharmD",
    is_recently_verified: true
  },
  {
    id: "inv-30",
    pharmacy_id: "pharm-6",
    medicine_id: "med-12", // Pantoprazole 40mg
    strength: "40mg",
    dosage_form: "Tablet",
    quantity: 30,
    price: 119.00,
    status: "in_stock",
    last_updated: "2 hours ago",
    last_verified_at: "Today at 1:20 PM",
    verification_timestamp: NOW - (2 * HOUR),
    verified_by: "James Wilson, PharmD",
    is_recently_verified: true
  },

  // LifeLine Super Chemist (pharm-7)
  {
    id: "inv-31",
    pharmacy_id: "pharm-7",
    medicine_id: "med-1",
    strength: "500mg",
    dosage_form: "Capsule",
    quantity: 180,
    price: 98.50,
    status: "in_stock",
    last_updated: "20 mins ago",
    last_verified_at: "Today at 2:50 PM",
    verification_timestamp: NOW - (20 * 60 * 1000),
    verified_by: "Priya Patel, PharmD",
    is_recently_verified: true
  },
  {
    id: "inv-32",
    pharmacy_id: "pharm-7",
    medicine_id: "med-3",
    strength: "650mg",
    dosage_form: "Tablet",
    quantity: 400,
    price: 38.75,
    status: "in_stock",
    last_updated: "15 mins ago",
    last_verified_at: "Today at 2:55 PM",
    verification_timestamp: NOW - (15 * 60 * 1000),
    verified_by: "Priya Patel, PharmD",
    is_recently_verified: true
  },
  {
    id: "inv-33",
    pharmacy_id: "pharm-7",
    medicine_id: "med-4",
    strength: "500mg",
    dosage_form: "Tablet",
    quantity: 210,
    price: 55.90,
    status: "in_stock",
    last_updated: "35 mins ago",
    last_verified_at: "Today at 2:35 PM",
    verification_timestamp: NOW - (35 * 60 * 1000),
    verified_by: "Priya Patel, PharmD",
    is_recently_verified: true
  },
  {
    id: "inv-34",
    pharmacy_id: "pharm-7",
    medicine_id: "med-5",
    strength: "20mg",
    dosage_form: "Tablet",
    quantity: 95,
    price: 146.50,
    status: "in_stock",
    last_updated: "1 hour ago",
    last_verified_at: "Today at 2:10 PM",
    verification_timestamp: NOW - HOUR,
    verified_by: "Priya Patel, PharmD",
    is_recently_verified: true
  },
  {
    id: "inv-35",
    pharmacy_id: "pharm-7",
    medicine_id: "med-8",
    strength: "50mg",
    dosage_form: "Tablet",
    quantity: 65,
    price: 80.80,
    status: "in_stock",
    last_updated: "45 mins ago",
    last_verified_at: "Today at 2:25 PM",
    verification_timestamp: NOW - (45 * 60 * 1000),
    verified_by: "Priya Patel, PharmD",
    is_recently_verified: true
  },
  {
    id: "inv-36",
    pharmacy_id: "pharm-7",
    medicine_id: "med-13", // Amlodipine 5mg
    strength: "5mg",
    dosage_form: "Tablet",
    quantity: 120,
    price: 50.00,
    status: "in_stock",
    last_updated: "25 mins ago",
    last_verified_at: "Today at 2:45 PM",
    verification_timestamp: NOW - (25 * 60 * 1000),
    verified_by: "Priya Patel, PharmD",
    is_recently_verified: true
  },

  // Beacon Hill Compounding (pharm-8)
  {
    id: "inv-37",
    pharmacy_id: "pharm-8",
    medicine_id: "med-14", // Montelukast 10mg
    strength: "10mg",
    dosage_form: "Tablet",
    quantity: 50,
    price: 158.00,
    status: "in_stock",
    last_updated: "1 hour ago",
    last_verified_at: "Today at 2:15 PM",
    verification_timestamp: NOW - HOUR,
    verified_by: "Robert Langdon, RPh",
    is_recently_verified: true
  },
  {
    id: "inv-38",
    pharmacy_id: "pharm-8",
    medicine_id: "med-15", // Ciprofloxacin 500mg
    strength: "500mg",
    dosage_form: "Tablet",
    quantity: 35,
    price: 66.50,
    status: "in_stock",
    last_updated: "2 hours ago",
    last_verified_at: "Today at 1:15 PM",
    verification_timestamp: NOW - (2 * HOUR),
    verified_by: "Robert Langdon, RPh",
    is_recently_verified: true
  },
  {
    id: "inv-39",
    pharmacy_id: "pharm-8",
    medicine_id: "med-9",
    strength: "100mcg",
    dosage_form: "Inhaler",
    quantity: 4,
    price: 166.00,
    status: "low_stock",
    last_updated: "3 hours ago",
    last_verified_at: "Today at 12:15 PM",
    verification_timestamp: NOW - (3 * HOUR),
    verified_by: "Robert Langdon, RPh",
    is_recently_verified: true
  },
  // NewTown Dispensary (pharm-9, unverified staging)
  {
    id: "inv-40",
    pharmacy_id: "pharm-9",
    medicine_id: "med-1",
    strength: "500mg",
    dosage_form: "Capsule",
    quantity: 45,
    price: 98.50,
    status: "in_stock",
    last_updated: "Just now",
    last_verified_at: "Pending Verification",
    verification_timestamp: NOW,
    verified_by: "Arthur Pendelton, RPh",
    is_recently_verified: false
  },
  {
    id: "inv-41",
    pharmacy_id: "pharm-9",
    medicine_id: "med-3",
    strength: "650mg",
    dosage_form: "Tablet",
    quantity: 60,
    price: 38.50,
    status: "in_stock",
    last_updated: "Just now",
    last_verified_at: "Pending Verification",
    verification_timestamp: NOW,
    verified_by: "Arthur Pendelton, RPh",
    is_recently_verified: false
  }
];


export const INITIAL_ENQUIRIES: AvailabilityEnquiry[] = [
  {
    id: "enq-1",
    pharmacy_id: "pharm-1",
    pharmacy_name: "CarePlus Metro Pharmacy",
    user_name: "Rahul Sharma",
    user_phone: "+91 98640 23489",
    user_email: "mchen@example.com",
    medicines: [
      { medicine_name: "Amoxicillin", strength: "500mg", quantity: 20 },
      { medicine_name: "Paracetamol", strength: "650mg", quantity: 15 }
    ],
    notes: "Need for urgent pickup today at 4:30 PM. Please reserve.",
    status: "pending",
    created_at: "10 minutes ago"
  },
  {
    id: "enq-2",
    pharmacy_id: "pharm-2",
    pharmacy_name: "Apex 24/7 Health Chemist",
    user_name: "Ananya Dutta",
    user_phone: "+91 94350 78912",
    user_email: "swilliams@example.com",
    medicines: [
      { medicine_name: "Augmentin", strength: "625mg", quantity: 14 }
    ],
    notes: "Doctor prescribed 2 weeks course. Can pick up in 1 hour.",
    status: "confirmed",
    created_at: "45 minutes ago"
  }
];

// Sample prescription templates for 1-click test drive
export const SAMPLE_PRESCRIPTIONS = [
  {
    id: "sample-rx-1",
    title: "Post-Op Antibiotics & Pain Care",
    doctor: "Dr. Hitesh Baruah, MD (Medicine)",
    clinic: "Gauhati University Health Centre, Jalukbari",
    medicines: [
      { detected_name: "Amoxicillin", strength: "500mg", dosage_form: "Capsule", quantity: 20, instructions: "1 capsule TID x 7 days with water" },
      { detected_name: "Paracetamol", strength: "650mg", dosage_form: "Tablet", quantity: 15, instructions: "1 tab PO Q6H PRN severe pain" },
      { detected_name: "Omeprazole", strength: "20mg", dosage_form: "Capsule", quantity: 14, instructions: "1 cap daily before breakfast" }
    ],
    previewText: "Rx: Amoxicillin 500mg caps #20, Paracetamol 650mg tabs #15, Omeprazole 20mg caps #14."
  },
  {
    id: "sample-rx-2",
    title: "Cardiometabolic Management (Multi-Med)",
    doctor: "Dr. Nabajit Das, MD, DM (Cardiology)",
    clinic: "GMCH Heart Centre, Guwahati",
    medicines: [
      { detected_name: "Metformin HCl", strength: "500mg", dosage_form: "Tablet", quantity: 60, instructions: "1 tab BID with meals" },
      { detected_name: "Atorvastatin", strength: "20mg", dosage_form: "Tablet", quantity: 30, instructions: "1 tab daily at bedtime" },
      { detected_name: "Losartan Potassium", strength: "50mg", dosage_form: "Tablet", quantity: 30, instructions: "1 tab daily in the morning" }
    ],
    previewText: "Rx: Metformin 500mg tabs #60, Atorvastatin 20mg tabs #30, Losartan 50mg tabs #30."
  },
  {
    id: "sample-rx-3",
    title: "Respiratory Infection & Relief",
    doctor: "Dr. Priyam Saikia, MD (Pulmonology)",
    clinic: "Jalukbari Chest Care Clinic, Guwahati",
    medicines: [
      { detected_name: "Azithromycin", strength: "500mg", dosage_form: "Tablet", quantity: 6, instructions: "500mg day 1, then 250mg days 2-5" },
      { detected_name: "Salbutamol Inhaler", strength: "100mcg", dosage_form: "Inhaler", quantity: 1, instructions: "2 puffs Q4H PRN shortness of breath" },
      { detected_name: "Montelukast", strength: "10mg", dosage_form: "Tablet", quantity: 30, instructions: "1 tab daily at evening" }
    ],
    previewText: "Rx: Azithromycin 500mg #6, Salbutamol Inhaler 100mcg #1, Montelukast 10mg #30."
  }
];
