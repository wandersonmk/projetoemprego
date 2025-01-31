/*
  # Corrigir relações das candidaturas

  1. Alterações
    - Ajusta a relação entre service_applications e profiles
    - Adiciona índices para melhor performance
    - Atualiza as políticas de segurança
*/

-- Primeiro, remover a constraint existente
ALTER TABLE service_applications DROP CONSTRAINT IF EXISTS service_applications_provider_id_fkey;

-- Adicionar a nova constraint correta
ALTER TABLE service_applications
  ADD CONSTRAINT service_applications_provider_id_fkey
  FOREIGN KEY (provider_id) REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Atualizar as políticas
DROP POLICY IF EXISTS "Providers can view their own applications" ON service_applications;
DROP POLICY IF EXISTS "Clients can view applications for their services" ON service_applications;
DROP POLICY IF EXISTS "Providers can submit applications" ON service_applications;
DROP POLICY IF EXISTS "Providers can update their own applications" ON service_applications;

-- Recriar as políticas
CREATE POLICY "Applications are viewable by involved parties"
  ON service_applications FOR SELECT
  USING (
    auth.uid() = provider_id OR
    auth.uid() IN (
      SELECT client_id FROM services WHERE id = service_id
    )
  );

CREATE POLICY "Providers can submit applications"
  ON service_applications FOR INSERT
  WITH CHECK (
    auth.uid() = provider_id AND
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'provider'
    )
  );

CREATE POLICY "Providers can update their own applications"
  ON service_applications FOR UPDATE
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_service_applications_provider_id ON service_applications(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_applications_service_id ON service_applications(service_id);