/*
  # Fix service applications RLS policies for provider check

  1. Changes
    - Update provider check in RLS policy to properly verify provider profiles
    - Simplify policy conditions for better performance
    - Add explicit provider profile check

  2. Security
    - Maintain existing security model
    - Ensure proper provider verification
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Providers can view their own applications" ON service_applications;
DROP POLICY IF EXISTS "Clients can view applications for their services" ON service_applications;
DROP POLICY IF EXISTS "Providers can submit applications" ON service_applications;
DROP POLICY IF EXISTS "Providers can update their own applications" ON service_applications;

-- Create new policies with proper provider check
CREATE POLICY "Providers can view their own applications"
  ON service_applications FOR SELECT
  USING (
    auth.uid() = provider_id
  );

CREATE POLICY "Clients can view applications for their services"
  ON service_applications FOR SELECT
  USING (
    auth.uid() IN (
      SELECT client_id FROM services WHERE id = service_id
    )
  );

CREATE POLICY "Providers can submit applications"
  ON service_applications FOR INSERT
  WITH CHECK (
    -- Must be authenticated and provider ID must match
    auth.uid() = provider_id
    -- Must be a provider with a provider profile
    AND EXISTS (
      SELECT 1 
      FROM profiles p
      JOIN provider_profiles pp ON pp.id = p.id
      WHERE p.id = auth.uid() 
      AND p.user_type = 'provider'
    )
    -- Can only apply to open services
    AND EXISTS (
      SELECT 1 
      FROM services 
      WHERE id = service_id 
      AND status = 'open'
    )
  );

CREATE POLICY "Providers can update their own applications"
  ON service_applications FOR UPDATE
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

-- Add index to improve policy performance
CREATE INDEX IF NOT EXISTS idx_provider_profiles_id ON provider_profiles(id);