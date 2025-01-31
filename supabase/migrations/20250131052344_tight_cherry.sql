/*
  # Sample Services Data

  1. Purpose
    - Populate the database with 12 diverse services across different categories
    - Create realistic service listings with varied budgets and locations
    - Provide a good mix of service types for testing and demonstration

  2. Services Categories
    - Technology & Development
    - Home Services
    - Design & Creative
    - Professional Services
    - Education & Training
*/

-- Insert sample client profiles first (if they don't exist)
DO $$
DECLARE
  client1_id uuid;
  client2_id uuid;
  client3_id uuid;
BEGIN
  -- Create client profiles if they don't exist
  INSERT INTO profiles (id, email, full_name, user_type, credits)
  VALUES 
    ('d7f73d4c-8a5e-4c4a-9c3b-6c6e6f6d7e8f', 'maria.silva@example.com', 'Maria Silva', 'client', 1000),
    ('e8f83e4d-9b6f-5d5b-ad4c-7d7e7f7e8f9f', 'joao.santos@example.com', 'João Santos', 'client', 1500),
    ('f9f93f4e-ac7f-6e6c-be5d-8e8f8f8f9f0f', 'ana.oliveira@example.com', 'Ana Oliveira', 'client', 2000)
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO client1_id;

  -- Insert sample services
  INSERT INTO services (client_id, title, description, category, budget, location, deadline, status)
  VALUES
    -- Technology & Development
    (
      'e8f83e4d-9b6f-5d5b-ad4c-7d7e7f7e8f9f',
      'Desenvolvimento de Website Responsivo',
      'Preciso de um desenvolvedor para criar um website responsivo para minha loja de roupas. O site deve incluir catálogo de produtos, carrinho de compras e integração com meios de pagamento.',
      'tecnologia',
      5000.00,
      'São Paulo, SP',
      NOW() + INTERVAL '30 days',
      'open'
    ),
    (
      'd7f73d4c-8a5e-4c4a-9c3b-6c6e6f6d7e8f',
      'Aplicativo Mobile para Delivery',
      'Desenvolvimento de aplicativo mobile para sistema de delivery de comida. Necessário experiência com React Native e integração com APIs.',
      'tecnologia',
      8000.00,
      'Rio de Janeiro, RJ',
      NOW() + INTERVAL '45 days',
      'open'
    ),
    
    -- Design & Creative
    (
      'f9f93f4e-ac7f-6e6c-be5d-8e8f8f8f9f0f',
      'Design de Logo e Identidade Visual',
      'Preciso de um designer para criar a identidade visual completa da minha startup de tecnologia. Inclui logo, paleta de cores e guia de estilo.',
      'design',
      2500.00,
      'Curitiba, PR',
      NOW() + INTERVAL '15 days',
      'open'
    ),
    (
      'd7f73d4c-8a5e-4c4a-9c3b-6c6e6f6d7e8f',
      'Edição de Vídeo para YouTube',
      'Busco editor de vídeo para canal do YouTube sobre culinária. Necessário conhecimento em After Effects e motion graphics.',
      'design',
      1800.00,
      'Belo Horizonte, MG',
      NOW() + INTERVAL '7 days',
      'open'
    ),

    -- Home Services
    (
      'e8f83e4d-9b6f-5d5b-ad4c-7d7e7f7e8f9f',
      'Reforma de Banheiro',
      'Preciso reformar dois banheiros. Serviço inclui troca de piso, instalação de box e nova pia. Material por conta do contratante.',
      'reforma',
      4500.00,
      'São Paulo, SP',
      NOW() + INTERVAL '20 days',
      'open'
    ),
    (
      'f9f93f4e-ac7f-6e6c-be5d-8e8f8f8f9f0f',
      'Instalação de Ar Condicionado',
      'Instalação de 3 aparelhos de ar condicionado split. Necessário profissional certificado com experiência.',
      'manutencao',
      1200.00,
      'Salvador, BA',
      NOW() + INTERVAL '5 days',
      'open'
    ),

    -- Professional Services
    (
      'd7f73d4c-8a5e-4c4a-9c3b-6c6e6f6d7e8f',
      'Consultoria Financeira para Pequena Empresa',
      'Preciso de consultor financeiro para análise de fluxo de caixa e planejamento financeiro de pequena empresa.',
      'consultoria',
      3000.00,
      'Florianópolis, SC',
      NOW() + INTERVAL '10 days',
      'open'
    ),
    (
      'e8f83e4d-9b6f-5d5b-ad4c-7d7e7f7e8f9f',
      'Assessoria Jurídica Empresarial',
      'Busco advogado especializado em direito empresarial para revisão de contratos e consultoria mensal.',
      'juridico',
      2800.00,
      'Porto Alegre, RS',
      NOW() + INTERVAL '15 days',
      'open'
    ),

    -- Education & Training
    (
      'f9f93f4e-ac7f-6e6c-be5d-8e8f8f8f9f0f',
      'Aulas Particulares de Matemática',
      'Professor particular de matemática para aluno do ensino médio. Foco em preparação para o ENEM.',
      'educacao',
      800.00,
      'Recife, PE',
      NOW() + INTERVAL '60 days',
      'open'
    ),
    (
      'd7f73d4c-8a5e-4c4a-9c3b-6c6e6f6d7e8f',
      'Curso de Fotografia para Iniciantes',
      'Instrutor de fotografia para ministrar curso básico para grupo de 5 pessoas. Equipamento fornecido pelos alunos.',
      'educacao',
      1500.00,
      'Brasília, DF',
      NOW() + INTERVAL '30 days',
      'open'
    ),

    -- Specialized Services
    (
      'e8f83e4d-9b6f-5d5b-ad4c-7d7e7f7e8f9f',
      'Tradução de Documentos Técnicos',
      'Necessito de tradutor português-inglês para documentação técnica de equipamento industrial. Aproximadamente 50 páginas.',
      'traducao',
      2200.00,
      'Campinas, SP',
      NOW() + INTERVAL '25 days',
      'open'
    ),
    (
      'f9f93f4e-ac7f-6e6c-be5d-8e8f8f8f9f0f',
      'Consultoria em Marketing Digital',
      'Consultoria para estratégia de marketing digital, incluindo SEO, redes sociais e campanhas pagas.',
      'marketing',
      3500.00,
      'Fortaleza, CE',
      NOW() + INTERVAL '20 days',
      'open'
    );
END $$;