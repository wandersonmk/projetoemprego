-- Add provider_name and provider_avatar columns to service_applications
ALTER TABLE public.service_applications
ADD COLUMN provider_name text,
ADD COLUMN provider_avatar text;

-- Update existing applications with provider information
UPDATE public.service_applications sa
SET 
  provider_name = p.full_name,
  provider_avatar = p.avatar_url
FROM public.profiles p
WHERE sa.provider_id = p.id;
