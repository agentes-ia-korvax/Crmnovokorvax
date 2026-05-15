# 🎯 FlowDesk CRM - Documentação Completa

## Transformação de Sistema: Imobiliária → CRM Agência de Serviços

Bem-vindo ao **Gestify**, seu novo CRM para controlar clientes, serviços e cobranças recorrentes!

---

## 📋 O que Mudou?

### **1. Contexto Geral**
- ❌ **Antes**: Painel de Atendimento IA para Imobiliária
- ✅ **Agora**: CRM - Controle de Clientes, Serviços e Cobranças

### **2. Setores → Tipos de Serviço**
| Antes (Imóvel) | Depois (Serviço) |
|---|---|
| ALUGUEL | SITE |
| COMPRA | SOCIAL_MEDIA |
| VENDA_IMOVEL | GESTAO_MIDIAS |
| AGENDAMENTO | IDENTIDADE_VISUAL |
| — | CONSULTORIA |
| — | OUTRO |

**Cores dos Serviços:**
- 🔵 SITE: #3b82f6
- 💗 SOCIAL_MEDIA: #ec4899
- 🟠 GESTAO_MIDIAS: #f59e0b
- 🟢 IDENTIDADE_VISUAL: #10b981
- 🟣 CONSULTORIA: #8b5cf6

### **3. Nichos de Mercado**
Novidade! Agora você pode categorizar seus clientes por nicho:

- E-commerce 🛍️
- Consultórios 🏥
- Restaurantes 🍽️
- Imobiliária 🏢
- Advocacia ⚖️
- Educação 📚
- Saúde 💊
- Beleza 💄
- Tecnologia 💻
- Varejo 🛒
- Serviços 🔧
- Outro

---

## 🎨 Novas Funcionalidades

### **1. Módulo de Clientes**
- ✅ Cadastro com Nome, Telefone, Nicho e Tipo de Serviço
- ✅ Status Ativo/Inativo
- ✅ Data de criação
- ✅ Filtros por Serviço e Nicho
- ✅ Busca por nome ou telefone
- ✅ Exportação de CSV

### **2. Módulo de Cobranças** (NOVO!)
Controle completo de pagamentos recorrentes:

**Campos:**
- 📌 Descrição (ex: "Site mensal - Dezembro")
- 💰 Valor (em R$)
- 📅 Data de Vencimento
- 🔄 Tipo de Recorrência:
  - Mensal (30 dias)
  - Trimestral (90 dias)
  - Semestral (180 dias)
  - Anual (365 dias)
  - Única (sem repetição)
- 🔗 Webhook URL (opcional - para notificações)
- ✅ Status (Ativa/Paga/Cancelada)

**Alertas Inteligentes:**
- 🔴 Vermelho: Cobrança vencida
- 🟠 Laranja: Vence em até 7 dias
- 🟢 Verde: Tudo certo

### **3. Sistema de Webhooks**
Quando uma cobrança é criada, você pode configurar um webhook para receber notificações:

**Exemplo de Webhook:**
```bash
POST https://seu-webhook.com/cobranca

{
  "tipo": "cobranca_criada",
  "cobranca": {
    "cliente_id": "123",
    "descricao": "Site mensal",
    "valor": "500",
    "data_vencimento": "2024-06-15",
    "tipo_recorrencia": "mensal",
    "status": "ativa"
  },
  "data": "2024-05-15T10:30:00Z"
}
```

### **4. Dashboard com KPIs**
- 📊 Total de Clientes
- ✅ Clientes Ativos
- ⏸️ Clientes Inativos
- 🚨 Cobranças Vencendo (próximos 7 dias)
- 📈 Crescimento de Clientes (últimos 7 dias)
- 🎯 Serviços em Demanda (gráfico de pizza)

---

## 🚀 Como Usar

### **Setup Inicial**

1. **Instale as dependências:**
```bash
npm install
```

2. **Configure as variáveis de ambiente** (`.env`):
```
REACT_APP_SUPABASE_URL=sua_url_aqui
REACT_APP_SUPABASE_KEY=sua_chave_aqui
REACT_APP_EVO_URL=sua_evolution_api_url
REACT_APP_EVO_KEY=sua_evolution_api_key
REACT_APP_EVO_INST=seu_instance_name
```

3. **Inicie o projeto:**
```bash
npm start
```

### **Primeiros Passos**

1. **Login**: Use as credenciais padrão ou configuradas no Supabase
2. **Adicione clientes**: Vá para "Clientes" e comece a cadastrar
3. **Configure serviços**: Adicione o tipo de serviço para cada cliente
4. **Crie cobranças**: Acesse "Cobranças" e adicione pagamentos recorrentes
5. **Configure webhooks**: Opcionalmente, adicione URLs para receber notificações

---

## 📊 Estrutura de Dados (Supabase)

### **Tabela: `dados_cliente`**
```sql
CREATE TABLE dados_cliente (
  id UUID PRIMARY KEY,
  nomewpp TEXT,
  telefone TEXT UNIQUE,
  tipo_servico TEXT, -- SITE, SOCIAL_MEDIA, etc
  nicho TEXT, -- E-commerce, Consultórios, etc
  atendimento_ia TEXT, -- 'ativo' ou 'pause'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Tabela: `cobrancas`** (NOVA)
```sql
CREATE TABLE cobrancas (
  id BIGINT PRIMARY KEY,
  cliente_id UUID REFERENCES dados_cliente(id),
  descricao TEXT,
  valor DECIMAL(10, 2),
  data_vencimento DATE,
  tipo_recorrencia TEXT, -- mensal, trimestral, etc
  status TEXT, -- ativa, paga, cancelada
  webhook_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔔 Alertas e Notificações

### **Dashboard**
O dashboard exibe automaticamente:
- ⚠️ Número de cobranças vencidas
- 🚨 Número de cobranças vencendo (próximos 7 dias)
- 📌 Lista das cobranças em atraso

### **Webhooks**
Quando você cria uma cobrança com webhook configurado:
1. O sistema envia um POST para a URL informada
2. Você pode usar um serviço como **Zapier**, **Make** ou **n8n** para:
   - Enviar email automático
   - Criar tarefa no seu CRM
   - Notificar via WhatsApp/Telegram
   - Atualizar planilhas

**Exemplo com n8n:**
- Crie um webhook no n8n que receba os dados
- Configure ações automáticas (enviar email, registrar cobrança, etc)

---

## 🎮 Navegação

### **Menu Principal**

| Seção | Função |
|-------|--------|
| 👁️ Visão Geral | Dashboard com KPIs e gráficos |
| 👥 Clientes | Gerenciar todos os clientes |
| 💰 Cobranças | Controlar pagamentos recorrentes |
| 💬 Conversas | Histórico de mensagens via WhatsApp |
| 📅 Agenda | Agendar atividades e tarefas |
| 👤 Usuários | Gerenciar usuários do sistema |
| 🎨 Aparência | Customizar cores e branding |

---

## 🔧 Funcionalidades Avançadas

### **White Label / Customização**
Você pode customizar completamente a aparência:
- 🏷️ Nome da Marca
- 🔤 Inicial (para avatar)
- 🎨 Cor Primária
- 📝 Subtítulo

Vá em **Aparência** (admin) para mudar.

### **Modo Escuro/Claro**
Clique no ícone de sol/lua no rodapé para alternar temas.

### **Exportação de Dados**
Na seção de Clientes, clique em "Exportar" para baixar um CSV com todos os clientes filtrados.

---

## ⚙️ Integrações

### **Supabase**
- Armazena clientes, cobranças e conversas
- Autenticação de usuários
- Configurações de white label

### **Evolution API** (WhatsApp)
- Envia mensagens via WhatsApp
- Recebe e armazena conversas
- Webhook para mensagens recebidas

### **Webhooks Customizados**
- Configure URLs para receber notificações
- Use com Zapier, Make, n8n, etc
- Automação de processos

---

## 📱 Responsividade

O sistema foi otimizado para:
- 🖥️ Desktop (full feature)
- 📱 Tablet (interface responsiva)
- 📲 Mobile (versão reduzida)

---

## 🆘 Troubleshooting

### **Problema: Não consigo conectar ao Supabase**
- Verifique as credenciais no `.env`
- Certifique-se que a API está ativa
- Verifique se há CORS habilitado

### **Problema: WhatsApp não está enviando mensagens**
- Verifique a Evolution API
- Confira se a instância está ativa
- Certifique-se que o número tem o formato correto

### **Problema: Webhook não está sendo chamado**
- Certifique-se que a URL é válida e acessível
- Verifique se há firewall bloqueando
- Adicione logs no seu servidor webhook

---

## 🎯 Próximas Funcionalidades (Roadmap)

- [ ] Dashboard com gráficos de faturamento
- [ ] Relatórios PDF de cobranças
- [ ] Integração com Stripe/PayPal
- [ ] Multi-empresa/workspace
- [ ] Permissões granulares de usuários
- [ ] Agendamento automático de cobranças
- [ ] Notificações por email/SMS
- [ ] Histórico de alterações

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação acima
2. Consulte os logs do console
3. Verifique o status de seus serviços (Supabase, Evolution API)
4. Contate o suporte técnico

---

## 📜 Licença

Este projeto é baseado no FlowDesk original e mantém a mesma estrutura e filosofia.

**Versão**: 2.0 CRM  
**Data**: Maio de 2026  
**Status**: Ativo e em desenvolvimento

---

## 🙏 Agradecimentos

Obrigado por usar o Gestify! Esperamos que este CRM ajude sua agência a crescer! 🚀
