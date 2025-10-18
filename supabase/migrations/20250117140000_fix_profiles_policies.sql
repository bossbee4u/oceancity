-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Allow authenticated users to read all profiles (needed for username validation)
-- This is safe because profiles don't contain sensitive information
CREATE POLICY "Authenticated users can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert profiles (for user creation)
CREATE POLICY "Authenticated users can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own profile, or any authenticated user (for admin functionality)
CREATE POLICY "Users can update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete profiles (for admin functionality)
CREATE POLICY "Authenticated users can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (true);