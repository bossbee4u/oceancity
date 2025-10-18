-- Fix search_path for handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix search_path for generate_company_code function
CREATE OR REPLACE FUNCTION public.generate_company_code()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;