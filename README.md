# 🎯 Gestify - CRM Agência de Serviços

**CRM completo para gerenciar clientes, serviços e cobranças recorrentes**

[![Status](https://img.shields.io/badge/status-ativo-brightgreen)]() 
[![Versão](https://img.shields.io/badge/versão-2.0-blue)]() 
[![Licença](https://img.shields.io/badge/licença-MIT-green)]()

---

## ✨ Destaques

✅ **Gestão de Clientes** - Cadastro completo com Nichos e Tipos de Serviço  
✅ **Controle de Cobranças** - Pagamentos recorrentes com alertas automáticos  
✅ **Webhooks** - Notificações automáticas para vencimentos  
✅ **Dashboard KPI** - Visualize métricas importantes em tempo real  
✅ **WhatsApp Integrado** - Histórico de conversas com clientes  
✅ **Dark Mode** - Tema escuro/claro  
✅ **White Label** - Customização completa de cores e branding  
✅ **Exportação** - Baixe seus dados em CSV  

---

## 🚀 Quick Start

### 1️⃣ Instalação

```bash
# Clone ou copie os arquivos
cd flowdesk-crm

# Instale dependências
npm install
```

### 2️⃣ Configuração

Crie um arquivo `.env.local` na raiz do projeto:

```env
REACT_APP_SUPABASE_URL=https://seu-project.supabase.co
REACT_APP_SUPABASE_KEY=sua_chave_publica_aqui
REACT_APP_EVO_URL=https://sua-evolution-api.com
REACT_APP_EVO_KEY=sua_chave_evolution_aqui
REACT_APP_EVO_INST=seu_instance_name
```

### 3️⃣ Inicie o servidor

```bash
npm start
```

Acesse: http://localhost:3000

---

## 📚 Documentação

- **[DOCUMENTACAO.md](./DOCUMENTACAO.md)** - Guia completo do sistema
- **[GUIA_MIGRACAO.md](./GUIA_MIGRACAO.md)** - Como migrar dados da imobiliária
- **[DEPLOY.md](./DEPLOY.md)** - Instruções de deploy em produção

---

## 🎨 Tipos de Serviço

| Serviço | Código | Descrição |
|---------|--------|-----------|
| 🌐 Site | `SITE` | Websites profissionais |
| 📱 Social Media | `SOCIAL_MEDIA` | Gestão de redes sociais |
| 📊 Gestão de Mídias | `GESTAO_MIDIAS` | Google Ads, Facebook Ads, etc |
| 🎨 Identidade Visual | `IDENTIDADE_VISUAL` | Logos, cartões, branding |
| 💼 Consultoria | `CONSULTORIA` | Consultoria em marketing digital |

---

## 🎯 Nichos Suportados

- E-commerce
- Consultórios
- Restaurantes
- Imobiliária
- Advocacia
- Educação
- Saúde
- Beleza
- Tecnologia
- Varejo
- Serviços
- Outro

---

## 💰 Sistema de Cobranças

### Recorrências Suportadas
- **Mensal** - A cada 30 dias
- **Trimestral** - A cada 90 dias
- **Semestral** - A cada 180 dias
- **Anual** - A cada 365 dias
- **Única** - Cobrado uma única vez

### Webhook para Automações
Crie um webhook e o sistema enviará dados quando:
- ✅ Cobrança for criada
- ✅ Cobrança vencer
- ✅ Pagamento for registrado

---

## 🔐 Autenticação

### Login Padrão
```
Usuário: admin
Senha: admin123
```

⚠️ **Mude as credenciais em produção!**

Gerenciar usuários em: **Configurações → Usuários** (Admin)

---

## 🔄 Integrações

### Supabase
- Banco de dados de clientes
- Armazenamento de cobranças
- Histórico de conversas
- Configurações da aplicação

### Evolution API
- Envio de mensagens via WhatsApp
- Recebimento de mensagens
- Webhook para novas mensagens

### Webhooks Customizados
Integre com:
- [Zapier](https://zapier.com)
- [Make](https://make.com)
- [n8n](https://n8n.io)

---

## 📊 Funcionalidades por Seção

### 👁️ Visão Geral
- KPI de clientes (total, ativos, inativos)
- Alertas de cobranças vencendo
- Gráfico de crescimento de clientes
- Serviços mais contratados

### 👥 Clientes
- Busca e filtros avançados
- Classificação por nicho
- Classificação por tipo de serviço
- Status ativo/inativo
- Exportação em CSV

### 💰 Cobranças
- Cadastro de cobrança
- Alertas de vencimento
- Status de pagamento
- Recorrências automáticas
- Webhook para notificações

### 💬 Conversas
- Histórico de mensagens
- Envio de mensagens via WhatsApp
- Integração com Evolution API

### 📅 Agenda
- Agendar compromissos
- Visualizar calendário
- Lembretes de tarefas

### 👤 Usuários (Admin)
- Gerenciar usuários do sistema
- Controlar permissões
- Visualizar plano/licença

### 🎨 Aparência (Admin)
- Customizar cores
- Mudar nome da marca
- White label completo

---

## 🛠️ Tecnologias

- **React 18** - Framework frontend
- **Supabase** - Backend + Database
- **Evolution API** - WhatsApp
- **Recharts** - Gráficos
- **Vercel** - Deploy recomendado

---

## 📈 Roadmap

- [ ] Relatórios com análise de faturamento
- [ ] Integração com Stripe/PayPal
- [ ] Dashboard executivo em PDF
- [ ] Multi-empresa/workspace
- [ ] Permissões granulares
- [ ] Automação de cobranças
- [ ] Notificações por SMS/Email
- [ ] Histórico de alterações (audit log)

---

## 🆘 Troubleshooting

### "Erro de autenticação no Supabase"
- Verifique `REACT_APP_SUPABASE_URL` e `REACT_APP_SUPABASE_KEY`
- Confira as policies do Supabase
- Teste com Postman as credenciais

### "WhatsApp não envia mensagens"
- Verifique `REACT_APP_EVO_URL` e `REACT_APP_EVO_KEY`
- Confirme que a instância Evolution está ativa
- Teste a instância no Evolution Dashboard

### "Webhook não funciona"
- Certifique-se a URL é válida e pública
- Verifique firewall/CORS
- Teste com webhook.site para debug

---

## 📝 Variáveis de Ambiente Detalhadas

```env
# Supabase
REACT_APP_SUPABASE_URL=https://[project].supabase.co
REACT_APP_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIs... (Chave pública)

# Evolution API (WhatsApp)
REACT_APP_EVO_URL=https://[seu-servidor].com
REACT_APP_EVO_KEY=A22EACBD08B1-4AAC-A51D...
REACT_APP_EVO_INST=seu_instance_name
```

---

## 🚀 Deploy

### Vercel (Recomendado)

```bash
# Instale Vercel CLI
npm i -g vercel

# Deploy
vercel

# Com variáveis de ambiente
vercel env add REACT_APP_SUPABASE_URL
vercel env add REACT_APP_SUPABASE_KEY
# ... etc
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📞 Suporte

- 📖 Consulte [DOCUMENTACAO.md](./DOCUMENTACAO.md)
- 🔄 Para migração: veja [GUIA_MIGRACAO.md](./GUIA_MIGRACAO.md)
- 🐛 Reporte bugs no console do navegador
- 💬 Mantenha logs dos webhooks para debug

---

## 📄 Licença

MIT License - Sinta-se livre para usar e modificar

---

## 🙏 Créditos

Desenvolvido como evolução do FlowDesk original.

**Versão:** 2.0 CRM  
**Última atualização:** Maio de 2026

---

<div align="center">

### Transforme sua Agência em um Negócio Escalável! 🚀

[Documentação Completa](./DOCUMENTACAO.md) • [Guia de Migração](./GUIA_MIGRACAO.md) • [Deploy](./DEPLOY.md)

</div>
