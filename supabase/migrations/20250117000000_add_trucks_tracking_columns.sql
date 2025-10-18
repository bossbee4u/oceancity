-- Add new optional columns to trucks table for tracking functionality
ALTER TABLE public.trucks 
ADD COLUMN vg_id VARCHAR,
ADD COLUMN longitude DECIMAL(10, 8),
ADD COLUMN latitude DECIMAL(11, 8),
ADD COLUMN tracking_link VARCHAR;

-- Add comments to describe the new columns
COMMENT ON COLUMN public.trucks.vg_id IS 'Vehicle GPS ID for tracking system integration';
COMMENT ON COLUMN public.trucks.longitude IS 'GPS longitude coordinate';
COMMENT ON COLUMN public.trucks.latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN public.trucks.tracking_link IS 'URL link to external tracking system';