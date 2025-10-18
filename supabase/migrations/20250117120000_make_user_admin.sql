-- Migration to make user with email filmipovdomains@gmail.com an admin
-- This script updates the user's role in the profiles table

-- Update the user's role to admin based on their email
UPDATE public.profiles 
SET role = 'admin', updated_at = NOW()
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'filmipovdomains@gmail.com'
);

-- Verify the update was successful
-- This will show the updated user profile
SELECT 
  p.id,
  u.email,
  p.username,
  p.full_name,
  p.role,
  p.updated_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'filmipovdomains@gmail.com';