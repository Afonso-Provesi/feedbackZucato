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
- `scripts/migration-dashboard-analytics.sql`
- `scripts/migration-anonymous-feedback.sql`
- `scripts/migration-security-input-events.sql`

## Variáveis de ambiente de produção

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ENCRYPTION_KEY`
- `ADMIN_SECRET`
- `NEXT_PUBLIC_API_URL`
- `PRIMARY_ADMIN_EMAIL` opcional
- `RECOVERY_SMTP_HOST`
- `RECOVERY_SMTP_PORT`
- `RECOVERY_SMTP_USER`
- `RECOVERY_SMTP_PASS`
- `RECOVERY_SMTP_FROM`
- `SECURITY_ALERT_EMAILS`
- `SECURITY_ALERT_SMTP_HOST` opcional
- `SECURITY_ALERT_SMTP_PORT` opcional
- `SECURITY_ALERT_SMTP_USER` opcional
- `SECURITY_ALERT_SMTP_PASS` opcional
- `SECURITY_ALERT_SMTP_FROM` opcional
- `UPSTASH_REDIS_REST_URL` opcional
- `UPSTASH_REDIS_REST_TOKEN` opcional

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
- validar envio de email de recovery e alertas antes da liberação final
- confirmar que o dashboard registra eventos suspeitos após aplicar a migration correspondente

## Validação final

- envio de feedback
- métricas no dashboard
- login com senha
- MFA TOTP
- geração de link de recovery
- redefinição de senha
- convite de novo admin
- bloqueio de payload suspeito com `npm run test-sql-injection-protection`

## Nota sobre roles

Se a coluna `role` ainda não existir na base de produção, o sistema entra em compatibilidade. A hierarquia completa só fica ativa após aplicar `scripts/migration-admin-management.sql`.

## Nota sobre auditoria e anonimato

- sem `scripts/migration-anonymous-feedback.sql`, o código ainda salva novos feedbacks como anônimos, mas dados antigos podem permanecer identificados
- sem `scripts/migration-security-input-events.sql`, o bloqueio de entrada suspeita funciona, porém sem trilha persistida para auditoria
