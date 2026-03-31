# Clínica Odontológica Zucato - Sistema de Feedback

Versão atual: 1.1.0

Sistema de coleta de feedback com formulário público, analytics operacionais e autenticação administrativa com Supabase Auth.

## Resumo

Esta versão consolida o produto em três frentes:

- coleta pública de feedback da clínica e do dentista
- dashboard administrativo com métricas, gráficos e governança de admins
- autenticação administrativa com recovery e MFA TOTP

## Funcionalidades

- formulário público em `/`
- nota de 1 a 10 para clínica
- nota de 1 a 10 para dentista
- comentários separados para clínica e dentista
- análise de sentimento combinando texto e nota
- página de agradecimento em `/obrigado`
- rastreamento de page views
- dashboard em `/autumn/audit`
- login em `/autumn/login`
- cards, gráficos e tabela de feedbacks
- desempenho por dentista
- gestão de contas administrativas
- redefinição de senha por link de recovery
- MFA TOTP no login administrativo

## Stack

- Next.js 16.1.6
- React 18
- TypeScript
- Tailwind CSS
- Supabase Database + Auth
- Chart.js

## Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
ENCRYPTION_KEY=hex_com_64_caracteres
ADMIN_SECRET=segredo_forte
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
ALLOW_DEV_2FA_FALLBACK=true
ADMIN_PATH=/autumn/audit
```

### 3. Aplicar schema no Supabase

Execute `database.sql` no SQL Editor do Supabase.

### 4. Aplicar migrations complementares

Execute também:

- `scripts/migration-device-fingerprint.sql`
- `scripts/migration-dentist-feedback.sql`
- `scripts/migration-admin-management.sql`

### 5. Criar admin inicial

```bash
node scripts/create-admin.js
```

### 6. Executar localmente

```bash
npm run dev
```

## Gestão de admins

### Criar ou atualizar um admin por script

```bash
node scripts/create-admin.js
```

Se o email já existir no Supabase Auth, o script reaproveita a conta e atualiza a senha com a senha digitada.

### Resetar um email de teste

```bash
npm run reset-admin-email -- email@dominio.com
```

Esse comando remove o usuário do Supabase Auth e o vínculo na tabela `admins`.

### Gerenciar pelo dashboard

O painel `Contas Administrativas` permite:

- cadastrar admins
- gerar link de definição de senha
- ativar ou desativar contas
- visualizar registros legados ou completos

## Login administrativo

Fluxo atual:

1. admin entra com email e senha
2. sistema valida Supabase Auth
3. sistema confirma autorização em `admins`
4. se não houver TOTP, abre enrollment
5. se houver TOTP, exige verificação

## Recovery de senha

1. gerar link de recovery
2. abrir `/autumn/login?mode=recovery`
3. sistema troca o `code` do link por sessão válida
4. nova senha é salva com `updateUser`

## APIs principais

### Públicas

- `POST /api/feedback`
- `POST /api/track-page-view`

### Administrativas

- `GET /api/admin/stats`
- `GET /api/admin/evolution`
- `GET /api/admin/feedbacks`
- `GET /api/admin/page-views`
- `GET /api/admin/dentist-performance`
- `GET /api/admin/admins`
- `POST /api/admin/admins`
- `PATCH /api/admin/admins`
- `GET /api/auth/check`
- `POST /api/auth/logout`

## Build

```bash
npm run build
```

## Documentação relacionada

- `SETUP.md`
- `DEPLOYMENT.md`
- `DEPLOY_TUTORIAL.md`
- `SUPABASE_AUTH_SETUP.md`
- `SECURITY_SETUP.md`
- `SHA256_MIGRATION.md`
- `CHANGELOG.md`

## Versionamento semântico

O projeto passa a seguir SemVer:

- `MAJOR`: quebra compatibilidade
- `MINOR`: adiciona funcionalidades compatíveis
- `PATCH`: corrige bugs sem alterar o contrato esperado

Esta release foi marcada como `1.1.0` porque consolida várias funcionalidades novas sem exigir ruptura estrutural de uso do produto.
