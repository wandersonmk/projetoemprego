/*
  # Sample Services Data

  1. Purpose
    - Populate the database with 12 diverse services across different categories
    - Create realistic service listings with varied budgets and locations
    - Provide a good mix of service types for testing and demonstration

  2. Services Categories
    - Technology & Development
    - Design & Creative
    - Home Services
    - Professional Services
    - Education & Training
*/

-- Insert sample services using a dynamic approach
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the first available user from auth.users
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  -- Only proceed if we have a valid user
  IF v_user_id IS NOT NULL THEN
    -- Insert sample services
    INSERT INTO services (client_id, title, description, category, budget, location, deadline, status)
    VALUES
      -- Technology & Development
      (
        v_user_id,
        'Desenvolvimento de Website Responsivo',
        'Preciso de um desenvolvedor para criar um website responsivo para minha loja de roupas. O site deve incluir catálogo de produtos, carrinho de compras e integração com meios de pagamento.',
        'tecnologia',
        5000.00,
        'São Paulo, SP',
        NOW() + INTERVAL '30 days',
        'open'
      ),
      (
        v_user_id,
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
        v_user_id,
        'Design de Logo e Identidade Visual',
        'Preciso de um designer para criar a identidade visual completa da minha startup de tecnologia. Inclui logo, paleta de cores e guia de estilo.',
        'design',
        2500.00,
        'Curitiba, PR',
        NOW() + INTERVAL '15 days',
        'open'
      ),
      (
        v_user_id,
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
        v_user_id,
        'Reforma de Banheiro',
        'Preciso reformar dois banheiros. Serviço inclui troca de piso, instalação de box e nova pia. Material por conta do contratante.',
        'reforma',
        4500.00,
        'São Paulo, SP',
        NOW() + INTERVAL '20 days',
        'open'
      ),
      (
        v_user_id,
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
        v_user_id,
        'Consultoria Financeira para Pequena Empresa',
        'Preciso de consultor financeiro para análise de fluxo de caixa e planejamento financeiro de pequena empresa.',
        'consultoria',
        3000.00,
        'Florianópolis, SC',
        NOW() + INTERVAL '10 days',
        'open'
      ),
      (
        v_user_id,
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
        v_user_id,
        'Aulas Particulares de Matemática',
        'Professor particular de matemática para aluno do ensino médio. Foco em preparação para o ENEM.',
        'educacao',
        800.00,
        'Recife, PE',
        NOW() + INTERVAL '60 days',
        'open'
      ),
      (
        v_user_id,
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
        v_user_id,
        'Tradução de Documentos Técnicos',
        'Necessito de tradutor português-inglês para documentação técnica de equipamento industrial. Aproximadamente 50 páginas.',
        'traducao',
        2200.00,
        'Campinas, SP',
        NOW() + INTERVAL '25 days',
        'open'
      ),
      (
        v_user_id,
        'Consultoria em Marketing Digital',
        'Consultoria para estratégia de marketing digital, incluindo SEO, redes sociais e campanhas pagas.',
        'marketing',
        3500.00,
        'Fortaleza, CE',
        NOW() + INTERVAL '20 days',
        'open'
      );
  END IF;
END $$;