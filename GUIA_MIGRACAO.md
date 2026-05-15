# 🔄 Guia de Migração: Imobiliária → CRM Agência de Serviços

## Transformação de seus Dados Existentes

Se você já tinha dados na versão de Imobiliária, aqui está como convertê-los para o novo CRM!

---

## 📊 Mapeamento de Campos

### **Clientes**

| Campo Antigo | Campo Novo | Transformação |
|---|---|---|
| `nomewpp` | `nomewpp` | Mantém igual ✅ |
| `telefone` | `telefone` | Mantém igual ✅ |
| `setor` (ALUGUEL, COMPRA, VENDA_IMOVEL) | `tipo_servico` | Veja mapeamento abaixo |
| `bairro` | *(removido)* | Não é mais usado |
| `interesse` | *(removido)* | Não é mais usado |
| `tipo_imovel` | *(removido)* | Não é mais usado |
| `orcamento` | *(removido)* | Use `cobrancas` agora |
| `visita_agendada` | *(use Agenda)* | Mova para módulo de Agenda |
| `data_visita` | *(use Agenda)* | Mova para módulo de Agenda |
| `atendimento_ia` | `atendimento_ia` | Mantém igual ✅ |
| `created_at` | `created_at` | Mantém igual ✅ |

### **Setores → Tipos de Serviço**

Mapeie seus clientes usando esta tabela:

| Setor Imobiliário | Novo Tipo de Serviço | Explicação |
|---|---|---|
| ALUGUEL | SITE | Cliente que aluga - precisa de presença web |
| COMPRA | SITE | Cliente interessado em compra - website é importante |
| VENDA_IMOVEL | GESTAO_MIDIAS | Vendo imóvel - usa redes sociais para divulgar |
| AGENDAMENTO | CONSULTORIA | Agendamento com consultor imobiliário |

**Exemplo SQL para migração:**
```sql
UPDATE dados_cliente
SET tipo_servico = CASE
  WHEN setor = 'ALUGUEL' THEN 'SITE'
  WHEN setor = 'COMPRA' THEN 'SITE'
  WHEN setor = 'VENDA_IMOVEL' THEN 'GESTAO_MIDIAS'
  WHEN setor = 'AGENDAMENTO' THEN 'CONSULTORIA'
  ELSE 'OUTRO'
END
WHERE setor IS NOT NULL;
```

### **Nichos para Clientes Imobiliários**

Todos os clientes da imobiliária devem ter o nicho `Imobiliária`:

```sql
UPDATE dados_cliente
SET nicho = 'Imobiliária'
WHERE atendimento_ia IS NOT NULL;
```

---

## 💰 Convertendo Orçamentos em Cobranças

Se você tinha um campo `orcamento` (preço que o cliente oferecia), converta para cobranças recorrentes:

### **Exemplo:**
```
Antigo:
- Cliente: João Silva
- Interesse: Aluguel
- Orçamento: R$ 5.000

Novo:
- Cliente: João Silva
- Tipo Serviço: SITE (conversão de aluguel)
- Nicho: Imobiliária
- Cobrança: Website Profissional
  - Valor: R$ 500/mês (estimado de R$ 5.000)
  - Recorrência: Mensal
  - Data Vencimento: [mês próximo]
```

---

## 📅 Migrando Visitas Agendadas

Se você tinha `visita_agendada` e `data_visita`, use o módulo de **Agenda**:

1. Remova ou mantenha esses campos de `dados_cliente`
2. Crie eventos no módulo de **Agenda** com a data
3. Adicione notas como "Visita ao imóvel - Av. Paulista, 1000"

---

## 🗂️ Passo-a-Passo de Migração

### **Passo 1: Fazer Backup**
```bash
# Exporte todos seus dados do Supabase
# No Supabase Dashboard → Backup → Download
```

### **Passo 2: Atualizar Banco de Dados**
Execute os SQLs acima para:
- Converter `setor` para `tipo_servico`
- Adicionar campo `nicho` (padrão: Imobiliária)

### **Passo 3: Criar Tabela de Cobranças**
Se ainda não existe:

```sql
CREATE TABLE cobrancas (
  id BIGINT PRIMARY KEY,
  cliente_id UUID REFERENCES dados_cliente(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  data_vencimento DATE NOT NULL,
  tipo_recorrencia TEXT DEFAULT 'mensal',
  status TEXT DEFAULT 'ativa',
  webhook_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cobrancas_cliente ON cobrancas(cliente_id);
CREATE INDEX idx_cobrancas_vencimento ON cobrancas(data_vencimento);
```

### **Passo 4: Popular Cobranças**

Para cada cliente com `orcamento`:

```sql
INSERT INTO cobrancas (
  id, cliente_id, descricao, valor, 
  data_vencimento, tipo_recorrencia, status
)
SELECT
  EXTRACT(EPOCH FROM NOW())::BIGINT + ROW_NUMBER() OVER () as id,
  c.id,
  'Serviço de ' || CASE WHEN c.tipo_servico = 'SITE' THEN 'Site' 
                        WHEN c.tipo_servico = 'GESTAO_MIDIAS' THEN 'Gestão de Mídias'
                        ELSE 'Consultoria' END as descricao,
  COALESCE(c.orcamento::numeric / 10, 500) as valor,
  CURRENT_DATE + INTERVAL '30 days' as data_vencimento,
  'mensal' as tipo_recorrencia,
  'ativa' as status
FROM dados_cliente c
WHERE c.orcamento IS NOT NULL AND c.orcamento > 0;
```

### **Passo 5: Testar**

1. Abra o novo CRM
2. Vá em "Clientes" - verifique se todos os dados estão
3. Vá em "Cobranças" - verifique se as cobranças foram criadas
4. Teste os filtros de Serviço e Nicho

### **Passo 6: Deploy**

```bash
npm run build
# Deploy normalmente (Vercel, etc)
```

---

## 🎯 Estratégia Pós-Migração

### **Para Clientes Existentes**

Se você quer oferecer **novos serviços** para seus clientes imobiliários:

#### **Estratégia 1: Serviços de Presença Web**
```
Mapeamento: Cliente de Imobiliária → Serviços de Presença Web

Serviços a Oferecer:
- SITE: Website profissional para imobiliária (R$ 500-1000/mês)
- SOCIAL_MEDIA: Gestão de redes sociais (R$ 300-500/mês)
- GESTAO_MIDIAS: Publicidade em Google/Facebook (R$ 500-2000/mês)
- IDENTIDADE_VISUAL: Logo, cartão, etc (R$ 500-1500 única)

Exemplo de Cobrança:
- Cliente: João Silva (Imobiliária)
- Serviço: SITE
- Descrição: "Website Profissional - Dezembro"
- Valor: R$ 750
- Recorrência: Mensal
- Webhook: Para notificar quando vencer
```

#### **Estratégia 2: Nicho Específico**
Mesmo que seja imobiliária, você pode classificar por subtipo:
- E-commerce de imóveis
- Advocacia imobiliária
- Consultoria imobiliária

---

## 📈 Novos Relatórios Possíveis

Com o novo CRM, você pode:

1. **Faturamento por Serviço**
   - Quanto ganha com Sites?
   - Quanto ganha com Gestão de Mídias?

2. **Faturamento por Nicho**
   - Qual nicho é mais lucrativo?
   - Qual gera mais cobranças?

3. **Taxa de Retenção**
   - Quantos clientes continuam ativos?
   - Qual é a taxa de churn?

4. **Alertas de Pagamento**
   - Quantas cobranças vencem esta semana?
   - Quantas estão vencidas?

---

## ✅ Checklist de Migração

- [ ] Backup dos dados originais
- [ ] SQL de conversão executado
- [ ] Tabela de cobranças criada
- [ ] Cobranças populadas
- [ ] Testar filtros de Serviço
- [ ] Testar filtros de Nicho
- [ ] Verificar Webhooks
- [ ] Deploy em produção
- [ ] Treinar equipe
- [ ] Comunicar mudanças aos clientes

---

## 🔄 Reversão (Se Necessário)

Se precisar voltar à versão antiga:

```bash
# Restaurar do backup
# No Supabase Dashboard → Backups → Restore
```

Os dados de cobranças estarão em uma tabela separada, então não afetará.

---

## 💡 Dicas Pro

### **1. Automatizar Cobranças**
Use n8n ou Zapier para:
- Enviar email 5 dias antes do vencimento
- Enviar WhatsApp no dia do vencimento
- Atualizar planilha Google Sheets

### **2. Webhook Exemplo (n8n)**
```json
{
  "método": "POST",
  "url": "https://seu-n8n.com/webhook/cobranca-vencendo",
  "body": {
    "cliente": "{{cliente_nome}}",
    "valor": "{{cobranca_valor}}",
    "vence_em": "{{dias_ate_vencimento}}"
  }
}
```

### **3. Categorizar Clientes**
Aproveite o novo campo `nicho` para:
- Oferecer serviços personalizados
- Criar campanhas focadas
- Analisar perfil de cliente

---

## 📞 Suporte Migração

Se tiver dúvidas:

1. **Verifique o DOCUMENTACAO.md** para mais detalhes
2. **Teste em ambiente de desenvolvimento** antes de produção
3. **Faça backup** sempre antes de migrations SQL
4. **Valide os dados** após cada etapa

---

Boa sorte com sua migração! 🚀
