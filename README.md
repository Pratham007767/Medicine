# MedFinder — Smart Medicine Availability & Pharmacy Locator

**MedFinder** is a full-stack healthcare web application engineered to solve a common, stressful patient problem: driving or walking from pharmacy to pharmacy only to discover that prescribed medicines are out of stock. 

MedFinder allows patients to find prescribed medicines across nearby pharmacies using **smart prescription uploads (OCR)** or **manual brand/generic searches**, displaying real-time stock levels, prices, distances, and an interactive **OpenStreetMap** locator.

---

## 🚀 Live Tech Stack

- **Frontend & Backend**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS (Modern healthcare aesthetic, Deep Navy `#06101e` & `#0b1d33`, Health Teal `#0d9488`, Emerald `#10b981`, Amber `#f59e0b`, Rose `#ef4444`)
- **Interactive Maps**: OpenStreetMap with Leaflet (`leaflet`, custom pulsing SVG pins & interactive popups)
- **Database & Storage**: Supabase PostgreSQL Schema with RLS policies + in-memory / local storage sync layer
- **Icons**: Lucide React (`lucide-react`)

---

## 🌟 Core Features & Implementation Highlights

### 1. Home Page (`/`)
- **Hero Banner**: *"Find Your Medicine. Without the Search."* with clean healthcare gradients.
- **Dual Main Action CTAs**:
  - `Upload Prescription` (Takes user directly to OCR document scanner)
  - `Search Medicine` (Opens catalog search and filter interface)
- **Live Search Bar**: Real-time lookup with popular search chips (*Amoxicillin 500mg*, *Paracetamol 650mg*, *Metformin 500mg*, *Atorvastatin 20mg*, *Salbutamol Inhaler*).
- **Location Detection Bar**: Browser Geolocation API integration with fallback to Metropolitan district presets (*Downtown*, *Midtown*, *Gramercy*, *Upper East Side*).
- **Nearby Pharmacy Availability Preview**: Cards displaying live store status, distances, and currently stocked medicines.
- **How It Works Section**: 4-step intuitive visual walkthrough.
- **Medical Disclaimer**: Clear licensed pharmacy verification and patient safety disclosures.

### 2. Prescription Scanning & Optical Character Recognition (`/prescription`)
- **Accepted Document Formats**: Supports **PDF**, **JPG**, and **PNG** prescription uploads with drag-and-drop or local file selector.
- **Full OCR Extraction**: Identifies medicine names, strengths (e.g. `500mg`, `20mg`), dosage forms (`Tablet`, `Capsule`, `Inhaler`, `Syrup`), and prescribed quantities (`#20`, `30 tabs`).
- **Raw Scanned OCR Text Inspection**: Collapsible raw text inspector allowing patients to review the exact unparsed text extracted from their document.
- **Mandatory User Confirmation Workflow**:
  - OCR is strictly treated as an assistive scanner, **never a medical verification system**.
  - Users are prompted to review and verify or correct every single extracted medicine.
  - **Uncertain / Unreadable Text Flagging**: Faint handwriting or ambiguous text is automatically flagged with an amber warning badge (`⚠️ Review Required: Unclear text/handwriting`) to prevent guessing.
  - Users can edit medicine names, change strengths, modify dosage forms, adjust quantities, delete entries, or add missing medications.
- **Search Only After 100% Confirmation**:
  - The pharmacy search button is locked until every extracted medicine is confirmed by the patient.
- **Immediate Matching Nearby Pharmacies**:
  - Upon user confirmation, the system directly evaluates nearby pharmacies:
    - **Single-Stop Complete Matches (100% In Stock)** with total cost, driving distance, and verified timestamps.
    - **Partial Matches** displaying what is in stock versus missing.
    - Interactive **OpenStreetMap Leaflet** radar plotting verified stores.
- **Strict Privacy & Safety Compliance**:
  - Temporary image buffers and object URLs are revoked from memory immediately upon processing completion.
  - Preserves exact prescribed brands and generic active ingredients without unauthorized clinical substitutions or alterations.

### 3. Intelligent Medicine Search Engine (`/search`)
- **Brand & Generic Search Engine**: Maps brand names (*Lipitor*, *Tylenol*, *Augmentin*, *Ventolin*, *Glucophage*, *Zyrtec*, *Prilosec*) directly to their active ingredients (*Atorvastatin*, *Acetaminophen*, *Amoxicillin-Clavulanate*, *Salbutamol*, *Metformin*, *Cetirizine*, *Omeprazole*).
- **Fuzzy Matching & Typo Tolerance**: Integrated Levenshtein and similarity matching to effortlessly handle common patient spelling variations (e.g. `amoxcillin` ➔ *Amoxicillin*, `paracetmol` ➔ *Paracetamol*, `lipiter` ➔ *Lipitor / Atorvastatin*, `augmenten` ➔ *Augmentin*).
- **Multi-Entity Matching**: Matches simultaneously across Medicine Name, Active Ingredient, Exact Prescribed Strength (`500mg`, `650mg`, `20mg`, `100mcg`), and Dosage Form (`Tablet`, `Capsule`, `Inhaler`, `Syrup`).
- **Prescribed Medicine Basket**: Search for single medications or add multiple prescribed medicines to a live search basket.
- **Single-Stop Store Prioritization**: Prioritizes pharmacies that have **ALL** requested medicines in a distinct top tier (*Complete Match: 100% In Stock*).
- **3 Sorting Modes**:
  1. 📍 **Nearest Pharmacy**: Sorts by Haversine GPS distance.
  2. 📦 **Most Medicines Available**: Prioritizes stores with 100% full basket availability.
  3. 💲 **Lowest Listed Price**: Sorts by total basket cost.
- **Strict Verification Recency Guarantee**:
  - A medicine only shows as available (`In Stock` / `Low Stock`) when verified by the pharmacy **within the past 24 hours**.
  - Stale inventory or unconfirmed items are automatically presented as **`Availability Unconfirmed`** with exact timestamps (e.g., *Last confirmed: 3 days ago - Call to verify*).
- **Strict Medical Safety**: Never substitutes alternative medicines or alters prescribed dosages.
- **Interactive OpenStreetMap Split View**: Live Leaflet map with colored availability pins and distance markers.

### 4. Nearby Pharmacy Locator (`/pharmacies`)
- **Interactive Leaflet Map**: Interactive OpenStreetMap tiles with custom SVG markers.
- **Dynamic Distance Calculation**: Uses the Haversine formula to compute exact driving/walking distance from patient coordinates.
- **Pharmacy Details**: License numbers, manager name, phone number, operating hours, and direct turn-by-turn navigation links.

### 5. Standardized Stock Availability Statuses
- 🟢 **In Stock**: Green/Emerald badge with units remaining.
- 🟡 **Low Stock**: Amber badge indicating less than 10 units left.
- 🔴 **Out of Stock**: Rose/Red badge preventing fruitless physical visits.
- ⚪ **Availability Unconfirmed**: Slate badge requesting pharmacy confirmation.

### 6. Results Dashboard — Multi-Medicine Basket Matching (`/results`)
- Solves the multi-medicine prescription challenge:
  - **Category 1 (Single-Stop Pharmacies)**: Shows stores that have **100%** of the prescribed medicines in stock, saving multiple trips.
  - **Category 2 (Partial Availability)**: Lists stores that stock some of the medicines (e.g., 2 of 3).
  - **Basket Total Cost**: Computes estimated prescription cost for the basket.
  - **1-Click Bulk Enquiry**: Sends a reservation request for all medicines simultaneously.

### 7. Pharmacy Owner Dashboard (`/pharmacy-dashboard`)
- **Dispensary Profile**: Manage pharmacy verification status, operating hours, and license information.
- **Stock Inventory Management**:
  - Add new medicines from the master catalog.
  - Inline quantity controls (`+10`, `-10`, or direct numeric input).
  - Inline price editing (`$`).
  - Stock status selector (`In Stock`, `Low Stock`, `Out of Stock`, `Unconfirmed`).
  - Search and filter inventory.
- **Patient Enquiries Inbox**: View reservation requests in real-time and respond with *"Confirm Reserved"* or *"Restocking Soon"*.
- **Register New Pharmacy**: Modal allowing pharmacy owners to register and verify new medical stores.

### 8. Authentication & Role Switcher (`/auth`)
- **Role-based Authentication**: Dedicated tabs for **Patient** and **Pharmacy Owner**.
- **Instant 1-Click Demo Login**:
  - Patient: *Alex Morgan*
  - Pharmacy Owner: *Dr. Evelyn Reed (CarePlus Metro Pharmacy)*
- Global top bar role switcher allowing seamless transitions between Patient View and Pharmacy Portal for testing and evaluation.

---

## 🗄️ Database Schema & Supabase Setup

The complete Supabase PostgreSQL schema with Row-Level Security (RLS) is located at `supabase/schema.sql`:

- `medicines`: Master pharmaceutical directory (brand names, generic names, forms, strengths).
- `pharmacies`: Licensed pharmacies with coordinates (`latitude`, `longitude`), contact, hours, and verification status.
- `inventory`: Stock records connecting pharmacies to medicines with quantity, price, and status.
- `enquiries`: Patient stock inquiries and reservation requests.
- `prescription_audit`: Privacy-preserving metadata audit logs.

### Setting up Live Supabase (Optional)
If you wish to connect a live Supabase instance:
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Copy the SQL from `supabase/schema.sql` into the Supabase SQL Editor and run it.
3. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
*Note: If no Supabase keys are provided, MedFinder automatically runs in offline/demo mode with persistent local storage and pre-loaded sample pharmacies and medicines!*

---

## 🏃 Running the Application

### 1. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Production Build
```bash
npm run build
npm run start
```

---

## 🛡️ Medical Safety & Privacy Guarantee
- **Never Makes Medical Decisions**: MedFinder strictly indexes drug inventory and pharmacy availability. It never makes clinical diagnosis, prescription alterations, or medical decisions.
- **No Unsolicited Storage**: Prescription scans are processed ephemerally on the client-side for entity extraction and are not retained on servers without patient consent.
- **Verified Listings**: Simulated demo listings are explicitly tagged with `[DEMO PROTOTYPE]` badges.
