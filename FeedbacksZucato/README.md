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
- todas as respostas públicas são anônimas por padrão e por regra no banco
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
ENCRYPTION_KEY=hex_com_64_caracteres
- auditoria persistente de entradas bloqueadas por payload suspeito no dashboard administrativo
RECOVERY_SMTP_HOST=smtp.gmail.com
RECOVERY_SMTP_PORT=587
RECOVERY_SMTP_USER=zucatorecovery@gmail.com
RECOVERY_SMTP_PASS=senha_de_app_do_gmail
RECOVERY_SMTP_FROM="Clinica Zucato <zucatorecovery@gmail.com>"
- `scripts/migration-anonymous-feedback.sql`
- `scripts/migration-security-input-events.sql`
SECURITY_ALERT_SMTP_PASS=
SECURITY_ALERT_SMTP_FROM=
SECURITY_ALERT_EMAILS=zucatorecovery@gmail.com
```

`RECOVERY_SMTP_*` define o remetente usado em 2FA e recuperação de senha. Se `SECURITY_ALERT_SMTP_*` ficar vazio, o sistema reaproveita automaticamente o mesmo Gmail do bloco de recovery para os alertas de segurança. `SECURITY_ALERT_EMAILS` define quem recebe esses alertas. Se os blocos novos não forem preenchidos, o sistema ainda aceita o `SMTP_*` antigo como fallback.

Para Gmail, use senha de app da conta Google. Senha normal da conta nao autentica no SMTP.

## Respostas anônimas

O fluxo público agora salva todas as avaliações como anônimas:

- a UI não pede mais identificação do paciente
- a API ignora qualquer `patient_name` enviado
- o banco aceita insert público apenas com `is_anonymous = true` e `patient_name IS NULL`

Se a base atual já tiver dados antigos com identificação, execute `scripts/migration-anonymous-feedback.sql` para anonimizar o histórico e alinhar a policy.

### 3. Aplicar schema no Supabase

Execute `database.sql` no SQL Editor do Supabase.

### 4. Aplicar migrations complementares

## Teste da proteção contra SQL injection

Com a aplicação rodando localmente, execute:

```bash
npm run dev
npm run test-sql-injection-protection
```

O script envia um payload propositalmente suspeito para `POST /api/feedback` e valida duas coisas:

- a API responde `400` bloqueando a entrada
- se `scripts/migration-security-input-events.sql` já tiver sido aplicado, o evento aparece persistido para auditoria

Você também pode verificar visualmente os bloqueios recentes no dashboard em `/autumn/audit`.

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

1. solicitar recovery na tela `/autumn/login` ou gerar link internamente
2. usuário recebe o link somente por email
3. abrir `/autumn/login?mode=recovery`
4. sistema troca o `code` do link por sessão válida
5. nova senha é salva com `updateUser`

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

## Performance e proteção

- rate limit distribuído opcional via `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`
- fallback automático para memória local quando o Redis externo não estiver configurado
- cache curto de analytics no servidor para reduzir carga repetida no dashboard
- RPCs SQL opcionais para stats, evolução, dentistas e page views com fallback para o modo compatível
- alertas por email para brute force e abuso no recovery via `SECURITY_ALERT_EMAILS`

Se voce quiser criar um Gmail so para isso, essa e a opcao mais direta para a fase atual do projeto: centraliza envio e recebimento numa caixa operacional simples e facilita auditoria.

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

## Validação do email de recovery

Para verificar a conexão SMTP e opcionalmente disparar um email de teste:

```bash
npm run test-recovery-email -- --verify-only
npm run test-recovery-email -- --send admin@dominio.com
npm run test-recovery-email -- --profile security-alert --verify-only
npm run test-recovery-email -- --profile security-alert --send alertas@dominio.com
```

Os comandos sem `--profile` validam o perfil de recovery. Com `--profile security-alert`, o script valida o perfil de alertas.

Se o provedor for Microsoft 365/Outlook e aparecer o erro `535 5.7.139 Authentication unsuccessful, basic authentication is disabled`, use app password ou configure as variáveis `*_OAUTH_CLIENT_ID`, `*_OAUTH_CLIENT_SECRET` e `*_OAUTH_REFRESH_TOKEN` no bloco correspondente.

## Versionamento semântico

O projeto passa a seguir SemVer:

- `MAJOR`: quebra compatibilidade
- `MINOR`: adiciona funcionalidades compatíveis
- `PATCH`: corrige bugs sem alterar o contrato esperado

Esta release foi marcada como `1.1.0` porque consolida várias funcionalidades novas sem exigir ruptura estrutural de uso do produto.
