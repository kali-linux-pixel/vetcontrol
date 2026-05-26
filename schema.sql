-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Profiles (User links to Auth & Tenants)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'veterinarian' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    joined_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Pets (Patients)
CREATE TABLE IF NOT EXISTS pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(50) NOT NULL CHECK (species IN ('dog', 'cat', 'bird', 'rabbit', 'other')),
    breed VARCHAR(255) NOT NULL,
    age VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    last_visit DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Consultation', 'Surgery', 'Vaccination', 'Check-up', 'Dental', 'Grooming')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('Scheduled', 'Checked-in', 'In-Progress', 'Completed', 'Cancelled')),
    veterinarian VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Medication', 'Food', 'Equipment', 'Supplies')),
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (organization_id, sku)
);

-- 7. Sales (Invoices)
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Paid', 'Pending', 'Refunded')),
    item_description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- INDEXES FOR FAST TENANT SEARCH
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_pets_org ON pets(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org ON appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_org ON inventory_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_org ON sales(organization_id);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- CREATE RLS TENANT POLICY HELPER FUNCTION
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS POLICIES FOR TENANTS (ORGANIZATION ISOLATION)

-- Organizations: Only select and update policies. Insert is handled by DB trigger, so no insert policy needed.
CREATE POLICY select_org ON organizations FOR SELECT USING (id = get_user_org_id());
CREATE POLICY update_org ON organizations FOR UPDATE USING (id = get_user_org_id());

-- Profiles: Authenticated users can select/update their own profiles. Trigger handles insertions, so no insert policy needed.
CREATE POLICY select_profile ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY update_profile ON profiles FOR UPDATE USING (id = auth.uid());

-- Clients policies
CREATE POLICY tenant_clients_policy ON clients 
    FOR ALL USING (organization_id = get_user_org_id());

-- Pets policies
CREATE POLICY tenant_pets_policy ON pets 
    FOR ALL USING (organization_id = get_user_org_id());

-- Appointments policies
CREATE POLICY tenant_appointments_policy ON appointments 
    FOR ALL USING (organization_id = get_user_org_id());

-- Inventory policies
CREATE POLICY tenant_inventory_policy ON inventory_items 
    FOR ALL USING (organization_id = get_user_org_id());

-- Sales policies
CREATE POLICY tenant_sales_policy ON sales 
    FOR ALL USING (organization_id = get_user_org_id());


-- SIGNUP TRIGGER FUNCTION FOR AUTO-PROVISIONING & ONBOARDING SEEDING
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_org_id UUID;
    clinic_name_val TEXT;
    full_name_val TEXT;
    sarah_client_id UUID;
    bruce_client_id UUID;
    max_pet_id UUID;
    ace_pet_id UUID;
BEGIN
  -- Extract metadata details passed from auth.signUp()
  clinic_name_val := COALESCE(new.raw_user_meta_data->>'clinic_name', 'My Vet Clinic');
  full_name_val := COALESCE(new.raw_user_meta_data->>'full_name', 'Doctor');

  -- 1. Create Organization Row (runs with superuser rights, bypasses RLS)
  INSERT INTO public.organizations (name)
  VALUES (clinic_name_val)
  RETURNING id INTO new_org_id;

  -- 2. Create Profile Row linked to the newly created Tenant Organization
  INSERT INTO public.profiles (id, organization_id, email, full_name, role)
  VALUES (
    new.id,
    new_org_id,
    new.email,
    full_name_val,
    'veterinarian'
  );

  -- 3. Seed Default Onboarding Clients
  INSERT INTO public.clients (organization_id, name, email, phone)
  VALUES 
    (new_org_id, 'Sarah Connor', 'sarah.c@sky.net', '(555) 019-2834'),
    (new_org_id, 'Bruce Wayne', 'bruce@waynecorp.com', '(555) 902-1245');

  -- Select the newly created client IDs to guarantee correct relations mapping
  SELECT id INTO sarah_client_id FROM public.clients WHERE organization_id = new_org_id AND name = 'Sarah Connor' LIMIT 1;
  SELECT id INTO bruce_client_id FROM public.clients WHERE organization_id = new_org_id AND name = 'Bruce Wayne' LIMIT 1;

  -- 4. Seed Default Onboarding Patients (Pets)
  INSERT INTO public.pets (organization_id, client_id, name, species, breed, age)
  VALUES 
    (new_org_id, sarah_client_id, 'Max', 'dog', 'German Shepherd', '3 years'),
    (new_org_id, bruce_client_id, 'Ace', 'dog', 'Great Dane', '5 years');

  -- Select patient IDs
  SELECT id INTO max_pet_id FROM public.pets WHERE organization_id = new_org_id AND name = 'Max' LIMIT 1;
  SELECT id INTO ace_pet_id FROM public.pets WHERE organization_id = new_org_id AND name = 'Ace' LIMIT 1;

  -- 5. Seed Today's Appointments (Scheduled & Checked-in)
  INSERT INTO public.appointments (organization_id, pet_id, date, time, type, status, veterinarian)
  VALUES 
    (new_org_id, max_pet_id, '2026-05-26', '09:00 AM', 'Consultation', 'Checked-in', full_name_val),
    (new_org_id, ace_pet_id, '2026-05-26', '01:15 PM', 'Check-up', 'Scheduled', full_name_val);

  -- 6. Seed Invoices (Sales Log)
  INSERT INTO public.sales (organization_id, client_id, pet_id, amount, date, status, item_description)
  VALUES 
    (new_org_id, sarah_client_id, max_pet_id, 125.00, '2026-05-26', 'Paid', 'Rabies Booster + Consultation'),
    (new_org_id, bruce_client_id, ace_pet_id, 85.00, '2026-05-26', 'Paid', 'Ear Infection Check-up');

  -- 7. Seed Clinic Inventory Stock
  INSERT INTO public.inventory_items (organization_id, name, sku, category, stock, min_stock, unit, price)
  VALUES 
    (new_org_id, 'Amoxicillin 250mg Tablets', 'MED-AMX-250', 'Medication', 120, 200, 'Tablets', 0.85),
    (new_org_id, 'Rabies Vaccine (Defensor 3)', 'VAC-RAB-DEF', 'Medication', 14, 50, 'Vials', 15.00),
    (new_org_id, 'Disposable Syringes 3ml', 'SUP-SYR-3ML', 'Supplies', 850, 300, 'Pieces', 0.12);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE DB TRIGGER TO BIND TRIGGERS ON SIGNUP
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
