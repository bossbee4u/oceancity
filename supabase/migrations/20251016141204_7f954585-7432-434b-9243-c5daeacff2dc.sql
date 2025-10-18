-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('admin', 'manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR UNIQUE NOT NULL,
  short_name VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Companies RLS Policies
CREATE POLICY "Authenticated users can read all companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete companies"
  ON public.companies FOR DELETE
  TO authenticated
  USING (true);

-- Create trucks table
CREATE TABLE public.trucks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_number VARCHAR UNIQUE NOT NULL,
  type VARCHAR NOT NULL,
  model INTEGER NOT NULL,
  expiry_date DATE NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('active', 'empty')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on trucks
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;

-- Trucks RLS Policies
CREATE POLICY "Authenticated users can read all trucks"
  ON public.trucks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create trucks"
  ON public.trucks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update trucks"
  ON public.trucks FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete trucks"
  ON public.trucks FOR DELETE
  TO authenticated
  USING (true);

-- Create trailers table
CREATE TABLE public.trailers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trailer_number VARCHAR UNIQUE NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('Box', 'Flatbed', 'Curtainside', 'TIR Box', 'TIR BL', 'Balmer', 'Reefer', 'Reefer TIR')),
  model INTEGER NOT NULL,
  expiry_date DATE NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('active', 'empty')),
  color VARCHAR NOT NULL CHECK (color IN ('red', 'blue', 'white', 'black', 'silver', 'orange', 'yellow')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on trailers
ALTER TABLE public.trailers ENABLE ROW LEVEL SECURITY;

-- Trailers RLS Policies
CREATE POLICY "Authenticated users can read all trailers"
  ON public.trailers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create trailers"
  ON public.trailers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update trailers"
  ON public.trailers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete trailers"
  ON public.trailers FOR DELETE
  TO authenticated
  USING (true);

-- Create drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  phone VARCHAR,
  gatepass DATE,
  waqala DATE,
  truck_id UUID REFERENCES public.trucks(id) ON DELETE SET NULL,
  trailer_id UUID REFERENCES public.trailers(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  status VARCHAR NOT NULL CHECK (status IN ('active', 'vacation', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on drivers
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Drivers RLS Policies
CREATE POLICY "Authenticated users can read all drivers"
  ON public.drivers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create drivers"
  ON public.drivers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update drivers"
  ON public.drivers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete drivers"
  ON public.drivers FOR DELETE
  TO authenticated
  USING (true);

-- Create shipments table
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_no VARCHAR UNIQUE NOT NULL,
  loading_date DATE NOT NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  truck_id UUID REFERENCES public.trucks(id) ON DELETE SET NULL,
  trailer_id UUID REFERENCES public.trailers(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  origin VARCHAR NOT NULL,
  destination VARCHAR NOT NULL,
  amount DECIMAL(10, 2),
  gross_weight DECIMAL(10, 2),
  net_weight DECIMAL(10, 2),
  status VARCHAR NOT NULL CHECK (status IN ('waiting', 'submitted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on shipments
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Shipments RLS Policies
CREATE POLICY "Authenticated users can read all shipments"
  ON public.shipments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create shipments"
  ON public.shipments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update shipments"
  ON public.shipments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete shipments"
  ON public.shipments FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_drivers
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_companies
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_trucks
  BEFORE UPDATE ON public.trucks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_trailers
  BEFORE UPDATE ON public.trailers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_shipments
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'manager')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-creating profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-generate company codes
CREATE OR REPLACE FUNCTION public.generate_company_code()
RETURNS TRIGGER AS $$
DECLARE
  max_code INTEGER;
  new_code VARCHAR;
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 3) AS INTEGER)), 0) + 1 INTO max_code
    FROM public.companies
    WHERE code ~ '^CO[0-9]+$';
    
    new_code := 'CO' || LPAD(max_code::TEXT, 2, '0');
    NEW.code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_company_code
  BEFORE INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.generate_company_code();