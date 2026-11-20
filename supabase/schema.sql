-- ========================================================
-- MEDFINDER - SMART MEDICINE AVAILABILITY & PHARMACY LOCATOR
-- SUPABASE POSTGRESQL DATABASE SCHEMA
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. MEDICINES DIRECTORY (Master Catalog)
CREATE TABLE IF NOT EXISTS public.medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    generic_name TEXT NOT NULL,
    brand_names TEXT[] DEFAULT '{}',
    category TEXT NOT NULL,
    dosage_form TEXT NOT NULL,
    strengths TEXT[] DEFAULT '{}',
    description TEXT,
    prescription_required BOOLEAN DEFAULT TRUE,
    common_uses TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast medicine lookup by name & generic name
CREATE INDEX IF NOT EXISTS idx_medicines_name ON public.medicines USING gin (to_tsvector('english', name || ' ' || generic_name));
CREATE INDEX IF NOT EXISTS idx_medicines_generic_name ON public.medicines(generic_name);

-- 2. PHARMACIES TABLE
CREATE TABLE IF NOT EXISTS public.pharmacies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    license_number TEXT NOT NULL UNIQUE,
    owner_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    rating NUMERIC(2,1) DEFAULT 4.5,
    opening_hours TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pharmacies_geo ON public.pharmacies(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_pharmacies_verified ON public.pharmacies(verified);

-- 3. PHARMACY INVENTORY TABLE
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
    strength TEXT NOT NULL,
    dosage_form TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL CHECK (status IN ('in_stock', 'low_stock', 'out_of_stock', 'unconfirmed')),
    batch_number TEXT,
    expiry_date DATE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    verification_timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    verified_by TEXT,
    CONSTRAINT unique_pharmacy_medicine_strength UNIQUE (pharmacy_id, medicine_id, strength, dosage_form)
);

CREATE INDEX IF NOT EXISTS idx_inventory_lookup ON public.inventory(medicine_id, pharmacy_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_verification ON public.inventory(verification_timestamp);

-- 4. AVAILABILITY ENQUIRIES & RESERVATIONS
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    user_email TEXT NOT NULL,
    medicines JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'fulfilled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PRESCRIPTION AUDIT LOG (Privacy preserving: No images saved, only anonymized metadata)
CREATE TABLE IF NOT EXISTS public.prescription_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    detected_count INTEGER NOT NULL,
    status TEXT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. INVENTORY HISTORY AUDIT TRAIL
CREATE TABLE IF NOT EXISTS public.inventory_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE SET NULL,
    medicine_name TEXT NOT NULL,
    strength TEXT NOT NULL,
    change_type TEXT NOT NULL,
    details TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;

-- 1. Medicines Catalog: Publicly readable by all patients & pharmacies
CREATE POLICY "Public read medicines" ON public.medicines 
    FOR SELECT 
    USING (true);

-- 2. Pharmacies: Public can ONLY view verified pharmacies or demo prototype data.
-- Unverified pharmacies can only be viewed by their authenticated owner.
CREATE POLICY "Public read verified pharmacies" ON public.pharmacies 
    FOR SELECT 
    USING (verified = true OR is_demo_data = true OR owner_id = auth.uid());

-- Authenticated pharmacy owners can register a pharmacy profile
CREATE POLICY "Pharmacy owners can create profile" ON public.pharmacies 
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- Pharmacy owners can update their own pharmacy profile
CREATE POLICY "Pharmacy owners can update own profile" ON public.pharmacies 
    FOR UPDATE 
    USING (owner_id = auth.uid()) 
    WITH CHECK (owner_id = auth.uid());

-- 3. Inventory: Public can ONLY view stock from verified pharmacies.
CREATE POLICY "Public read verified inventory" ON public.inventory 
    FOR SELECT 
    USING (
        pharmacy_id IN (
            SELECT id FROM public.pharmacies 
            WHERE (verified = true OR is_demo_data = true) OR owner_id = auth.uid()
        )
    );

-- Only VERIFIED pharmacy owners can insert, update, or delete stock availability.
-- Prevents unauthorized or unverified users from publishing inventory.
CREATE POLICY "Verified pharmacy owners can manage inventory" ON public.inventory 
    FOR ALL 
    USING (
        pharmacy_id IN (
            SELECT id FROM public.pharmacies 
            WHERE owner_id = auth.uid() AND (verified = true OR is_demo_data = true)
        )
    )
    WITH CHECK (
        pharmacy_id IN (
            SELECT id FROM public.pharmacies 
            WHERE owner_id = auth.uid() AND (verified = true OR is_demo_data = true)
        )
    );

-- 4. Enquiries & Reservations
-- Pharmacy owners can view & manage enquiries for their pharmacy
CREATE POLICY "Pharmacy owner manage enquiries" ON public.enquiries 
    FOR SELECT 
    USING (pharmacy_id IN (SELECT id FROM public.pharmacies WHERE owner_id = auth.uid()));

CREATE POLICY "Pharmacy owner update enquiries" ON public.enquiries 
    FOR UPDATE 
    USING (pharmacy_id IN (SELECT id FROM public.pharmacies WHERE owner_id = auth.uid()));

-- Patients can create enquiries
CREATE POLICY "Public can submit enquiries" ON public.enquiries 
    FOR INSERT 
    WITH CHECK (true);

-- Patients can view their own enquiries
CREATE POLICY "Users can view own enquiries" ON public.enquiries 
    FOR SELECT 
    USING (user_id = auth.uid());

-- 5. Prescription Audit Log (Privacy preserving)
CREATE POLICY "Users view own prescription audits" ON public.prescription_audit 
    FOR ALL 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 6. Inventory History Audit
CREATE POLICY "Pharmacy owners view inventory history" ON public.inventory_history 
    FOR SELECT 
    USING (pharmacy_id IN (SELECT id FROM public.pharmacies WHERE owner_id = auth.uid()));

CREATE POLICY "Pharmacy owners insert history logs" ON public.inventory_history 
    FOR INSERT 
    WITH CHECK (pharmacy_id IN (SELECT id FROM public.pharmacies WHERE owner_id = auth.uid()));
