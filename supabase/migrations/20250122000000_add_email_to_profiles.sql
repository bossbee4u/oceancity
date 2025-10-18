-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN email TEXT;

-- Create index on email for better performance
CREATE INDEX idx_profiles_email ON profiles(email);

-- Populate email field from auth.users table
UPDATE profiles 
SET email = auth_users.email 
FROM auth.users AS auth_users 
WHERE profiles.id = auth_users.id;

-- Make email column NOT NULL after populating data
ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;

-- Add unique constraint on email
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Create or replace function to automatically sync email from auth.users when profile is created
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Get email from auth.users and set it in the profile
  SELECT email INTO NEW.email 
  FROM auth.users 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync email when profile is inserted
DROP TRIGGER IF EXISTS trigger_sync_profile_email ON profiles;
CREATE TRIGGER trigger_sync_profile_email
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_email();

-- Create or replace function to update profile email when auth.users email changes
CREATE OR REPLACE FUNCTION sync_email_on_auth_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile email when auth.users email changes
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE profiles 
    SET email = NEW.email 
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync email when auth.users email is updated
DROP TRIGGER IF EXISTS trigger_sync_email_on_auth_update ON auth.users;
CREATE TRIGGER trigger_sync_email_on_auth_update
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_on_auth_update();