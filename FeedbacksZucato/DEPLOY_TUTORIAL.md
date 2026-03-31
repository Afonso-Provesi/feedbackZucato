# Tutorial de Deploy - Clínica Zucato Feedback System

Versão alvo: 1.1.0

## Opção 1: VERCEL (Recomendado - Melhor para Next.js)

A Vercel é a plataforma oficial do Next.js e oferece **plano gratuito robusto** para projetos de pequeno/médio porte.

### ✅ Pré-requisitos
- Conta GitHub (para fazer push do código)
- Conta Vercel (crie em https://vercel.com)

### Passo a Passo

#### 1. Prepare seu repositório Git

```bash
cd /home/neto/Documentos/FeedbacksZucato

# Inicializar git (se ainda não tiver)
git init
git add .
git commit -m "Initial commit - Zucato Feedback System"

# Criar repositório no GitHub
# Vá em https://github.com/new e crie um repo chamado "FeedbacksZucato"
# Depois execute:
git remote add origin https://github.com/SEU_USUARIO/FeedbacksZucato.git
git branch -M main
git push -u origin main
```

#### 2. Crie conta na Vercel e faça deploy

1. Acesse https://vercel.com/signup
2. Clique em "Continue with GitHub"
3. Autorize a Vercel
4. Clique em "New Project"
5. Selecione seu repositório "FeedbacksZucato"
6. Clique em "Import"

#### 3. Configure as Variáveis de Ambiente

Na página de configuração da Vercel, há uma seção "Environment Variables":

Adicione as variáveis do projeto com valores de produção:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
ENCRYPTION_KEY=sua-chave-de-encriptacao
ADMIN_SECRET=seu-admin-secret
NEXT_PUBLIC_API_URL=https://SEU_DOMINIO_VERCEL.vercel.app
PRIMARY_ADMIN_EMAIL=seu-email-principal@dominio.com
```

#### 4. Clique em "Deploy"

Pronto! A Vercel vai construir e fazer deploy automaticamente.

Você receberá um link tipo: `https://seu-projeto.vercel.app`

#### 5. Configure RLS no Supabase para aceitar requisições da Vercel

No painel do Supabase, vá em **Settings > CORS** e adicione:
```
https://seu-projeto.vercel.app
```

---

## Opção 2: Railway (Alternativa Gratuita)

Railway oferece $5/mês de crédito gratuito (suficiente para testes).

### Passo a Passo

1. Acesse https://railway.app
2. Clique em "Start a New Project"
3. Selecione "Deploy from GitHub"
4. Autorize e selecione seu repositório
5. Adicione as variáveis de ambiente na aba "Variables"
6. Clique em "Deploy"

---

## Opção 3: Netlify (Menos ideal para Next.js, mas gratuito)

1. Acesse https://netlify.com
2. Clique em "New site from Git"
3. Conecte GitHub
4. Selecione repositório
5. Build command: `npm run build`
6. Publish directory: `.next`
7. Adicione variáveis em "Build & Deploy > Environment"
8. Deploy!

---

## Post-Deploy: Configurações Importantes

### 1. Atualize o NEXT_PUBLIC_API_URL

Após receber o domínio da Vercel (ex: `zucato-feedback.vercel.app`), atualize no `.env` da Vercel:

```
NEXT_PUBLIC_API_URL=https://zucato-feedback.vercel.app
```

### 2. Permitir CORS no Supabase

Supabase > Settings > CORS:
- Adicione seu domínio Vercel
- Adicione `http://localhost:3000` para testes locais

### 3. Recriar Admin em Produção

Após deploy, recrie o admin (isso vai usar as credenciais de produção):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role \
ENCRYPTION_KEY=sua-chave-encriptacao \
node scripts/create-admin.js
```

### 4. Adicionar Domínio Customizado (Opcional)

Na Vercel:
- Vá em "Settings > Domains"
- Adicione seu domínio (ex: feedback.clinicazucato.com)
- Aponte os registros DNS conforme indicado

---

## 🔐 Segurança em Produção

### Mudar a ENCRYPTION_KEY

Antes de fazer deploy, gere uma chave aleatória de 64 caracteres hex:

```bash
# No Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e atualize nas variáveis de ambiente do Supabase (sem rolar em logs públicos).

### Revisar ADMIN_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## Testando o Deployment

### Login no Admin
1. Acesse `https://seu-projeto.vercel.app/admin/login`
2. Use as credenciais do admin criado
3. Verifique o dashboard em `/autumn/audit`

### Enviar Feedback
1. Acesse `https://seu-projeto.vercel.app`
2. Preencha formulário
3. Confirme que aparece no dashboard

### Verificar Logs
- **Vercel**: Vá em "Deployments" > seu deploy > "Logs"
- **Supabase**: Vá em "Logs" e filtre por erro

---

## Troubleshooting

### Erro: "Supabase não configurado"
- Verifique se as variáveis de ambiente foram adicionadas na Vercel
- Aguarde 2-3 minutos (Vercel precisa redeployar)
- Force rebuild: Settings > Deployments > redeploy

### Erro: "Cannot find module 'dotenv'"
- Execute: `npm install dotenv --save`
- Faça commit e push
- Force rebuild na Vercel

### 401 Unauthorized
- Verifique se as chaves Supabase estão corretas
- Confirme que o CORS foi adicionado em Supabase

---

## Próximos Passos (Opcional)

### Adicionar Domínio Customizado
- Registre em Namecheap, GoDaddy, etc.
- Aponte para Vercel
- Atualize arquivos de config

### Backup Automático
- Configure backups no Supabase (Settings > Backups)
- Ative replicação (para redundância)

### Monitoramento
- Integre Sentry para rastrear erros
- Configure alertas no Supabase

---

## Resumo Rápido (TL;DR)

1. **Push no GitHub**
   ```bash
   git init && git add . && git commit -m "initial"
   git remote add origin https://github.com/seu/repo.git
   git push -u origin main
   ```

2. **Deploy na Vercel**
   - Acesse vercel.com
   - Conecte GitHub
   - Selecione repositório
   - Adicione env vars
   - Deploy!

3. **Configure Supabase**
   - Adicione domínio em CORS
   - Recrie admin em produção

4. **Teste**
   - Acesse seu-projeto.vercel.app
   - Login em /autumn/login
   - Envie feedback teste

**Pronto!** 🎉
