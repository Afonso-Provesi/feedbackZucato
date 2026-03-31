# Checklist de Deployment - Clínica Odontológica Zucato

Versão alvo: 1.1.0

## Pré-deploy

- `npm install`
- `npm run build`
- `database.sql` aplicado
- migrations complementares aplicadas
- login admin validado
- recovery de senha validado
- dashboard validado

## Banco de dados

Aplicar no Supabase:

- `database.sql`
- `scripts/migration-device-fingerprint.sql`
- `scripts/migration-dentist-feedback.sql`
- `scripts/migration-admin-management.sql`

## Variáveis de ambiente de produção

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ENCRYPTION_KEY`
- `ADMIN_SECRET`
- `NEXT_PUBLIC_API_URL`
- `PRIMARY_ADMIN_EMAIL` opcional

## Deploy recomendado

### Vercel

```bash
vercel deploy --prod
```

Após o deploy:

- atualizar `NEXT_PUBLIC_API_URL`
- revisar `Authentication > URL Configuration` no Supabase
- adicionar redirect URLs de produção

## Segurança operacional

- rotacionar segredos antes de produção
- revisar emails admins ativos
- validar fluxo de logout e MFA
- revisar exposição de credenciais antigas

## Validação final

- envio de feedback
- métricas no dashboard
- login com senha
- MFA TOTP
- geração de link de recovery
- redefinição de senha
- convite de novo admin

## Nota sobre roles

Se a coluna `role` ainda não existir na base de produção, o sistema entra em compatibilidade. A hierarquia completa só fica ativa após aplicar `scripts/migration-admin-management.sql`.
