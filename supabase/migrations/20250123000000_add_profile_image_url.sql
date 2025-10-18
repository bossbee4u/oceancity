-- Add profile_image_url column to profiles table
ALTER TABLE public.profiles ADD COLUMN profile_image_url TEXT;

-- Create index on profile_image_url for better performance
CREATE INDEX idx_profiles_profile_image_url ON public.profiles(profile_image_url);

-- Add comment to the column
COMMENT ON COLUMN public.profiles.profile_image_url IS 'URL to the user profile image stored in Supabase storage';