# 🚀 Guia de Deploy - Gestify CRM

## Opções de Deploy Disponíveis

Você pode fazer deploy em várias plataformas. Aqui estão as mais recomendadas:

---

## 🏆 1. Vercel (RECOMENDADO)

A forma mais fácil de fazer deploy. Ideal para aplicações React.

### Setup

1. **Crie uma conta em [vercel.com](https://vercel.com)**

2. **Instale o Vercel CLI:**
```bash
npm i -g vercel
```

3. **Faça o deploy:**
```bash
cd flowdesk-crm
vercel
```

4. **Siga as instruções (escolha seu projeto, framework React, etc)**

5. **Configure as variáveis de ambiente:**

Opção A - Via CLI:
```bash
vercel env add REACT_APP_SUPABASE_URL
vercel env add REACT_APP_SUPABASE_KEY
vercel env add REACT_APP_EVO_URL
vercel env add REACT_APP_EVO_KEY
vercel env add REACT_APP_EVO_INST
```

Opção B - Via Dashboard:
- Acesse seu projeto no Vercel
- Vá em Settings → Environment Variables
- Adicione cada variável

6. **Faça novo deploy com as variáveis:**
```bash
vercel --prod
```

### Verificação
```bash
# Seu site estará em: https://seu-projeto.vercel.app
# Verifique em: https://seu-projeto.vercel.app/
```

---

## 2️⃣ Netlify

Alternativa ao Vercel, também muito simples.

### Setup

1. **Acesse [netlify.com](https://netlify.com) e crie conta**

2. **Conecte seu repositório GitHub**

3. **Configure Build:**
- Build command: `npm run build`
- Publish directory: `build`

4. **Configure variáveis de ambiente:**
- Settings → Environment variables
- Adicione todas as variáveis REACT_APP_*

5. **Deploy automático:**
- Toda vez que você fizer push no GitHub, o Netlify faz deploy automaticamente

---

## 🐳 3. Docker + Qualquer Cloud

Para ter mais controle ou usar diferentes providers.

### Dockerfile

Já crie o arquivo `Dockerfile` na raiz:

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copie package.json e instale dependências
COPY package*.json ./
RUN npm ci

# Copie código e faça build
COPY . .
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_KEY
ARG REACT_APP_EVO_URL
ARG REACT_APP_EVO_KEY
ARG REACT_APP_EVO_INST

ENV REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL
ENV REACT_APP_SUPABASE_KEY=$REACT_APP_SUPABASE_KEY
ENV REACT_APP_EVO_URL=$REACT_APP_EVO_URL
ENV REACT_APP_EVO_KEY=$REACT_APP_EVO_KEY
ENV REACT_APP_EVO_INST=$REACT_APP_EVO_INST

RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Instale serve para servir a aplicação
RUN npm install -g serve

# Copie build do stage anterior
COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
```

### Build Docker

```bash
docker build \
  --build-arg REACT_APP_SUPABASE_URL=seu_url \
  --build-arg REACT_APP_SUPABASE_KEY=sua_chave \
  --build-arg REACT_APP_EVO_URL=seu_evo_url \
  --build-arg REACT_APP_EVO_KEY=seu_evo_key \
  --build-arg REACT_APP_EVO_INST=seu_instance \
  -t gestify:latest .
```

### Rodar localmente

```bash
docker run -p 3000:3000 gestify:latest
# Acesse: http://localhost:3000
```

---

## 🏗️ 4. AWS (EC2 + S3)

Para infraestrutura mais robusta.

### Setup

1. **Faça build:**
```bash
npm run build
```

2. **Crie bucket S3:**
- AWS Console → S3 → Create Bucket
- Nome: seu-projeto-gestify
- Ative "Static website hosting"

3. **Configure policy de acesso público:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::seu-bucket/*"
  }]
}
```

4. **Faça upload da pasta `build`:**
```bash
aws s3 cp build/ s3://seu-bucket --recursive
```

5. **Seu site estará em:**
```
http://seu-bucket.s3-website-us-east-1.amazonaws.com
```

### CI/CD com GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to S3

on:
  push:
    branches: [ main, master ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          REACT_APP_SUPABASE_URL: ${{ secrets.REACT_APP_SUPABASE_URL }}
          REACT_APP_SUPABASE_KEY: ${{ secrets.REACT_APP_SUPABASE_KEY }}
          REACT_APP_EVO_URL: ${{ secrets.REACT_APP_EVO_URL }}
          REACT_APP_EVO_KEY: ${{ secrets.REACT_APP_EVO_KEY }}
          REACT_APP_EVO_INST: ${{ secrets.REACT_APP_EVO_INST }}
      
      - name: Deploy to S3
        run: aws s3 cp build/ s3://${{ secrets.AWS_S3_BUCKET }}/ --recursive
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
```

---

## 5️⃣ Render.com

Plataforma moderna e gratuita para pequenas aplicações.

### Setup

1. **Crie conta em [render.com](https://render.com)**

2. **Conecte seu repositório GitHub**

3. **Crie novo Web Service**
- Escolha seu repositório
- Ambiente: Node
- Build command: `npm ci && npm run build`
- Start command: `npm install -g serve && serve -s build -l 3000`

4. **Configure variáveis de ambiente**
- Environment → Add Environment Variable
- Adicione todas as REACT_APP_*

5. **Deploy automático**
- Render faz deploy automaticamente a cada push

---

## 🌐 Domínio Customizado

Para qualquer plataforma, você pode usar seu próprio domínio:

### Vercel
1. Settings → Domains
2. Adicione seu domínio
3. Configure DNS no seu registrador

### Netlify
1. Domain management → Add custom domain
2. Configure DNS

### AWS Route 53
1. Criar hosted zone
2. Adicionar records apontando para seu bucket

---

## ✅ Checklist Pré-Deploy

- [ ] `.env.local` configurado com todas as variáveis
- [ ] Testou localmente: `npm start`
- [ ] Build gera sem erros: `npm run build`
- [ ] Supabase está ativo e acessível
- [ ] Evolution API configurada e testada
- [ ] RLS policies habilitadas no Supabase
- [ ] Tabelas criadas no banco de dados
- [ ] Webhooks testados (se usando)

---

## 🔒 Segurança em Produção

### 1. Variáveis de Ambiente
```bash
# ❌ NUNCA faça isso
REACT_APP_SUPABASE_KEY=sua_chave_aqui_no_codigo

# ✅ SEMPRE use secrets
# No Vercel, Netlify, AWS, etc: use o gerenciador de secrets
```

### 2. CORS (Supabase)
Configure em Supabase:
1. Settings → API → CORS Allowed origins
2. Adicione seu domínio: `https://seu-site.com`

### 3. HTTPS
Todas as plataformas (Vercel, Netlify, etc) dão HTTPS grátis.

### 4. Senhas
⚠️ **Mude a senha padrão!**
- Login padrão: admin / admin123
- Vá em Usuários e altere

---

## 🐛 Debug em Produção

### Logs do Vercel
```bash
vercel logs
```

### Logs do Netlify
- Dashboard → Deploys → Build logs

### Teste de Conectividade
```bash
# Teste Supabase
curl -X GET 'https://seu-project.supabase.co/rest/v1/dados_cliente?limit=1' \
  -H 'apikey: sua_chave' \
  -H 'Authorization: Bearer sua_chave'

# Teste Evolution
curl -X GET 'https://seu-evo.com/instance/fetchInstances' \
  -H 'apikey: sua_chave_evo'
```

---

## 🚨 Troubleshooting

### "Build falhou"
- Verifique console do deploy
- Veja se há erro de import/sintaxe
- Confirme se todas as dependências foram instaladas

### "Aplicação não carrega (página em branco)"
- Abra DevTools (F12)
- Verifique Console para erros
- Verifique variáveis de ambiente

### "API retorna erro 401/403"
- Verifique credenciais Supabase/Evolution
- Verifique RLS policies
- Teste manualmente com curl

### "Webhook não funciona"
- Certifique-se que a URL é pública e acessível
- Teste com webhook.site
- Verifique logs da sua aplicação webhook

---

## 📈 Monitoramento

### Para produção, considere:

1. **Sentry** - Error tracking
```bash
npm install @sentry/react
```

2. **LogRocket** - Session replay
```bash
npm install logrocket
```

3. **Google Analytics**
```bash
npm install react-ga4
```

---

## 🎯 Próximos Passos Após Deploy

1. ✅ Teste completamente (clientes, cobranças, webhooks)
2. 📊 Configure alertas e monitoramento
3. 📞 Configure suporte
4. 🔐 Treine sua equipe
5. 📈 Acompanhe métricas de uso

---

## 📞 Suporte de Deploy

- **Vercel**: docs.vercel.com
- **Netlify**: docs.netlify.com
- **AWS**: docs.aws.amazon.com
- **Docker**: docs.docker.com

---

**Parabéns! Seu CRM está no ar! 🎉**

Agora é hora de começar a usar e crescer! 🚀
