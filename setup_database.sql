-- ═══════════════════════════════════════════════════════════════════════════════
-- GESTIFY - CRM Agência de Serviços
-- Setup completo do Banco de Dados Supabase
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- 1. Tabela de Clientes (DADOS_CLIENTE)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dados_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações básicas
  nomewpp TEXT NOT NULL,
  telefone TEXT UNIQUE NOT NULL,
  
  -- Serviço e Nicho (novo no CRM)
  tipo_servico TEXT DEFAULT 'OUTRO',
  nicho TEXT DEFAULT 'Outro',
  
  -- Status
  atendimento_ia TEXT DEFAULT 'ativo',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cliente_telefone ON dados_cliente(telefone);
CREATE INDEX IF NOT EXISTS idx_cliente_tipo_servico ON dados_cliente(tipo_servico);
CREATE INDEX IF NOT EXISTS idx_cliente_nicho ON dados_cliente(nicho);
CREATE INDEX IF NOT EXISTS idx_cliente_created ON dados_cliente(created_at DESC);

-- ───────────────────────────────────────────────────────────────────────────────
-- 2. Tabela de Cobranças (NOVO - FEATURE PRINCIPAL DO CRM)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cobrancas (
  id BIGINT PRIMARY KEY,
  
  -- Referência ao cliente
  cliente_id UUID NOT NULL REFERENCES dados_cliente(id) ON DELETE CASCADE,
  
  -- Informações de cobrança
  descricao TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  
  -- Data e recorrência
  data_vencimento DATE NOT NULL,
  tipo_recorrencia TEXT DEFAULT 'mensal', -- mensal, trimestral, semestral, anual, unica
  
  -- Status de pagamento
  status TEXT DEFAULT 'ativa', -- ativa, paga, cancelada
  
  -- Webhook para automação
  webhook_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cobranca_cliente ON cobrancas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_vencimento ON cobrancas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_cobranca_status ON cobrancas(status);
CREATE INDEX IF NOT EXISTS idx_cobranca_created ON cobrancas(created_at DESC);

-- ───────────────────────────────────────────────────────────────────────────────
-- 3. Tabela de Histórico de Chat (MANTÉM DO ORIGINAL)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS n8n_chat_histories (
  id BIGSERIAL PRIMARY KEY,
  
  -- Sessão (telefone do cliente)
  session_id TEXT NOT NULL,
  
  -- Mensagem (JSON)
  message JSONB NOT NULL,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_chat_session ON n8n_chat_histories(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON n8n_chat_histories(created_at DESC);

-- ───────────────────────────────────────────────────────────────────────────────
-- 4. Tabela de Configurações (MANTÉM DO ORIGINAL)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS configuracoes (
  id TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 5. POLÍTICAS RLS (Row Level Security)
-- ───────────────────────────────────────────────────────────────────────────────

-- Habilitar RLS
ALTER TABLE dados_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_chat_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Policies para dados_cliente
CREATE POLICY "Allow all access to dados_cliente" ON dados_cliente
  FOR ALL USING (true);

-- Policies para cobrancas
CREATE POLICY "Allow all access to cobrancas" ON cobrancas
  FOR ALL USING (true);

-- Policies para n8n_chat_histories
CREATE POLICY "Allow all access to chat histories" ON n8n_chat_histories
  FOR ALL USING (true);

-- Policies para configuracoes
CREATE POLICY "Allow all access to configuracoes" ON configuracoes
  FOR ALL USING (true);

-- ───────────────────────────────────────────────────────────────────────────────
-- 6. DADOS INICIAIS (EXEMPLOS)
-- ───────────────────────────────────────────────────────────────────────────────

-- Inserir configuração padrão de brand
INSERT INTO configuracoes (id, valor) VALUES
  ('brand', '{"nome":"Gestify","inicial":"G","subtitulo":"CRM - Controle de Clientes","tagCRM":"CRM IA","corPrimaria":"#8b5cf6"}')
ON CONFLICT (id) DO NOTHING;

-- Inserir configuração de usuários padrão
INSERT INTO configuracoes (id, valor) VALUES
  ('usuarios', '[{"username":"admin","password":"admin123","nome":"Admin","role":"admin"}]')
ON CONFLICT (id) DO NOTHING;

-- Inserir configuração de plano padrão
INSERT INTO configuracoes (id, valor) VALUES
  ('plano', '{"maxUsuarios":2,"nome":"Starter","vencimento":null,"status":"ativo","preco":0,"contatoVendas":""}')
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────────
-- 7. EXEMPLO DE CLIENTE (opcional)
-- ───────────────────────────────────────────────────────────────────────────────

-- INSERT INTO dados_cliente (nomewpp, telefone, tipo_servico, nicho, atendimento_ia)
-- VALUES 
--   ('João Silva', '5511999999999', 'SITE', 'E-commerce', 'ativo'),
--   ('Maria Santos', '5521988888888', 'SOCIAL_MEDIA', 'Consultórios', 'ativo'),
--   ('Pedro Costa', '5531977777777', 'GESTAO_MIDIAS', 'Restaurantes', 'pause');

-- ───────────────────────────────────────────────────────────────────────────────
-- 8. EXEMPLO DE COBRANÇA (opcional)
-- ───────────────────────────────────────────────────────────────────────────────

-- INSERT INTO cobrancas (
--   id, cliente_id, descricao, valor, 
--   data_vencimento, tipo_recorrencia, status
-- )
-- SELECT 
--   EXTRACT(EPOCH FROM NOW())::BIGINT + 1,
--   c.id,
--   'Website Profissional - Junho',
--   500.00,
--   CURRENT_DATE + INTERVAL '30 days',
--   'mensal',
--   'ativa'
-- FROM dados_cliente c
-- WHERE c.nomewpp = 'João Silva'
-- LIMIT 1;

-- ───────────────────────────────────────────────────────────────────────────────
-- 9. QUERIES ÚTEIS PARA GERENCIAMENTO
-- ───────────────────────────────────────────────────────────────────────────────

-- Ver total de clientes por tipo de serviço
-- SELECT tipo_servico, COUNT(*) as total FROM dados_cliente GROUP BY tipo_servico;

-- Ver cobranças vencendo (próximos 7 dias)
-- SELECT c.* FROM cobrancas c 
-- WHERE c.status = 'ativa' 
-- AND c.data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
-- ORDER BY c.data_vencimento;

-- Ver faturamento total por nicho
-- SELECT c.nicho, SUM(co.valor) as faturamento FROM dados_cliente c
-- LEFT JOIN cobrancas co ON c.id = co.cliente_id
-- WHERE co.status = 'ativa'
-- GROUP BY c.nicho
-- ORDER BY faturamento DESC;

-- ───────────────────────────────────────────────────────────────────────────────
-- 10. FUNÇÃO DE ATUALIZAÇÃO AUTOMÁTICA (updated_at)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_updated_at_cliente
  BEFORE UPDATE ON dados_cliente
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_cobranca
  BEFORE UPDATE ON cobrancas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIM DO SETUP
-- ═══════════════════════════════════════════════════════════════════════════════

-- ✅ Tabelas criadas e indexadas
-- ✅ RLS habilitado
-- ✅ Configurações iniciais inseridas
-- ✅ Funções de atualização automática criadas
--
-- Próximas etapas:
-- 1. Configurar sua Evolution API no painel
-- 2. Preencher as variáveis de ambiente (.env.local)
-- 3. Iniciar a aplicação com: npm start
-- 4. Fazer login com admin / admin123
-- 5. Começar a cadastrar clientes e cobranças!
