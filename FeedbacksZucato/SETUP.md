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
ALLOW_DEV_2FA_FALLBACK=false
ADMIN_PATH=/autumn/audit
UPSTASH_REDIS_REST_URL=https://seu-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=token-do-upstash
RECOVERY_SMTP_HOST=smtp.gmail.com
RECOVERY_SMTP_PORT=587
RECOVERY_SMTP_USER=zucatorecovery@gmail.com
RECOVERY_SMTP_PASS=senha-de-app-do-gmail
RECOVERY_SMTP_FROM="Clinica Zucato <zucatorecovery@gmail.com>"
SECURITY_ALERT_SMTP_HOST=
SECURITY_ALERT_SMTP_PORT=587
SECURITY_ALERT_SMTP_USER=
SECURITY_ALERT_SMTP_PASS=
SECURITY_ALERT_SMTP_FROM=
SECURITY_ALERT_EMAILS=zucatorecovery@gmail.com
# Opcional para Microsoft 365/Outlook quando o tenant bloquear basic auth:
RECOVERY_SMTP_OAUTH_CLIENT_ID=
RECOVERY_SMTP_OAUTH_CLIENT_SECRET=
RECOVERY_SMTP_OAUTH_REFRESH_TOKEN=
SECURITY_ALERT_SMTP_OAUTH_CLIENT_ID=
SECURITY_ALERT_SMTP_OAUTH_CLIENT_SECRET=
SECURITY_ALERT_SMTP_OAUTH_REFRESH_TOKEN=
```

### Qual email recebe cada coisa

- `RECOVERY_SMTP_*` define o email remetente usado pelo sistema para enviar 2FA e recovery.
- `SECURITY_ALERT_SMTP_*` define o email remetente usado para alertas de brute force, MFA falhando em massa e abuso de recovery.
- se `SECURITY_ALERT_SMTP_*` ficar vazio, o sistema reaproveita automaticamente o mesmo Gmail configurado em `RECOVERY_SMTP_*`.
- `SECURITY_ALERT_EMAILS` define o email ou lista de emails que recebe os alertas.
- se `SECURITY_ALERT_EMAILS` ficar vazio, os alertas caem automaticamente em `SECURITY_ALERT_SMTP_FROM`, `SECURITY_ALERT_SMTP_USER` ou no fallback antigo `SMTP_*`.
- emails de 2FA e recuperação de senha nao vao para uma caixa fixa: eles sao enviados para o email do admin que estiver tentando entrar ou recuperar a senha.
- para Gmail, use senha de app da conta Google, nao a senha normal da conta.
- para validar entrega real localmente, use `ALLOW_DEV_2FA_FALLBACK=false`.

## 2. Criar schema base

No SQL Editor do Supabase, execute `database.sql`.

## 3. Aplicar migrations complementares

Execute no SQL Editor:

- `scripts/migration-device-fingerprint.sql`
- `scripts/migration-dentist-feedback.sql`
- `scripts/migration-admin-management.sql`
- `scripts/migration-dashboard-analytics.sql`

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
- testar `Esqueci minha senha` e confirmar recebimento do email de recovery
- abrir `/autumn/audit`
- validar SMTP de recovery com `npm run test-recovery-email -- --verify-only`
- validar SMTP de alertas com `npm run test-recovery-email -- --profile security-alert --verify-only`

## Utilitário de reset para testes

Se o mesmo email ficou preso no Supabase Auth:

```bash
npm run reset-admin-email -- email@dominio.com
```

## Observações

- sem a migration de admin management, o sistema fica em modo compatível
- com a migration aplicada, a governança owner/admin fica coerente com o dashboard
- sem as variáveis do Upstash, o rate limit continua funcionando em memória local
- em tenants Microsoft 365 com basic auth desabilitado, use app password ou OAuth2 para o SMTP
- se voce quiser separar as caixas, use `RECOVERY_SMTP_*` para auth/recovery e `SECURITY_ALERT_SMTP_*` para alertas
- `SECURITY_ALERT_EMAILS` define quem recebe alertas de brute force e abuso na recuperação; se omitido, o sistema usa o remetente do bloco de alertas ou o fallback `SMTP_*`
