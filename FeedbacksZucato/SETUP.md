# Guia de Configuração - Ambiente Local

## 1. Variáveis de ambiente

Crie `.env.local` com:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
ENCRYPTION_KEY=hex-com-64-caracteres
ADMIN_SECRET=segredo-forte
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
ALLOW_DEV_2FA_FALLBACK=true
ADMIN_PATH=/autumn/audit
```

## 2. Criar schema base

No SQL Editor do Supabase, execute `database.sql`.

## 3. Aplicar migrations complementares

Execute no SQL Editor:

- `scripts/migration-device-fingerprint.sql`
- `scripts/migration-dentist-feedback.sql`
- `scripts/migration-admin-management.sql`

## 4. Instalar dependências

```bash
npm install
```

## 5. Criar admin inicial

```bash
node scripts/create-admin.js
```

## 6. Executar localmente

```bash
npm run dev
```

## 7. Validar fluxo mínimo

- abrir `/`
- enviar um feedback de teste
- abrir `/autumn/login`
- entrar com o admin criado
- configurar ou validar TOTP
- abrir `/autumn/audit`

## Utilitário de reset para testes

Se o mesmo email ficou preso no Supabase Auth:

```bash
npm run reset-admin-email -- email@dominio.com
```

## Observações

- sem a migration de admin management, o sistema fica em modo compatível
- com a migration aplicada, a governança owner/admin fica coerente com o dashboard
