/*
  # Fix service applications RLS policies

  1. Changes
    - Drop existing RLS policies for service_applications
    - Add new policies that properly handle provider applications
    - Ensure providers can only apply to open services
    - Add policy for clients to view applications for their services

  2. Security
    - Enable RLS on service_applications table
    - Add policies for SELECT, INSERT, and UPDATE operations
    - Restrict access based on user roles and service status
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Applications are viewable by involved parties" ON service_applications;
DROP POLICY IF EXISTS "Providers can create applications" ON service_applications;
DROP POLICY IF EXISTS "Providers can update their applications" ON service_applications;

-- Create new policies
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
    -- Must be authenticated
    auth.uid() IS NOT NULL
    -- Must be a provider
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'provider'
    )
    -- Can only apply to open services
    AND EXISTS (
      SELECT 1 FROM services 
      WHERE id = service_id 
      AND status = 'open'
    )
    -- Provider ID must match authenticated user
    AND provider_id = auth.uid()
  );

CREATE POLICY "Providers can update their own applications"
  ON service_applications FOR UPDATE
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);