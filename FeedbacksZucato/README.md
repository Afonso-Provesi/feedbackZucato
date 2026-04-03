# Clínica Odontológica Zucato - Sistema de Feedback

Versão documentada do projeto: 1.2.6

Este arquivo passou a concentrar a documentação operacional ativa do sistema. Os antigos guias separados de setup, deploy, segurança, auth, estrutura e personalização foram absorvidos aqui para reduzir redundância. O único documento histórico preservado fora daqui é `LEGACY_AUTH_NOTES.md`.

## Visão geral

O sistema entrega três frentes principais:

- coleta pública de feedback da clínica e do dentista
- dashboard administrativo protegido em rotas mascaradas
- autenticação administrativa com Supabase Auth SSR, recovery por email e MFA TOTP

## O que existe hoje

- formulário público em `/`
- página de agradecimento em `/obrigado`
- login administrativo em `/autumn/login`
- dashboard administrativo em `/autumn/audit`
- bloqueio explícito de `/admin/*` no proxy
- nota de 0 a 10 para clínica e dentista
- comentários separados para clínica e dentista
- análise de sentimento com categorias `positivo`, `negativo`, `neutro` e `misto`
- métricas gerais, evolução temporal, page views e desempenho por dentista
- gestão de contas administrativas com compatibilidade para bases legadas
- recuperação de senha por link enviado por email
- MFA TOTP no fluxo administrativo
- feedback público estritamente anônimo
- proteção centralizada contra payloads suspeitos
- auditoria persistente de entradas bloqueadas
- alertas de brute force, falhas de MFA e abuso na recuperação de senha
- rate limit com suporte a Upstash Redis e fallback em memória
- suporte a tema por clínica via `NEXT_PUBLIC_THEME`

## Stack

- Next.js 16.1.6
- React 18
- TypeScript
- Tailwind CSS
- Supabase Database + Auth SSR
- Nodemailer
- Chart.js

## Estrutura funcional

### Rotas públicas

- `/`
- `/obrigado`
- `POST /api/feedback`
- `POST /api/track-page-view`

### Rotas administrativas ativas

- `/autumn/login`
- `/autumn/audit`
- `GET /api/auth/check`
- `POST /api/auth/logout`
- `GET /api/admin/stats`
- `GET /api/admin/evolution`
- `GET /api/admin/feedbacks`
- `GET /api/admin/page-views`
- `GET /api/admin/dentist-performance`
- `GET /api/admin/security-input-events`
- `GET|POST|PATCH /api/admin/admins`

### Pastas principais

- `app/`: páginas, layouts e rotas API do App Router
- `components/`: UI pública, dashboard e painéis administrativos
- `lib/`: auth, segurança, email, temas, sentimento e acesso ao Supabase
- `scripts/`: migrations SQL, testes operacionais e utilitários administrativos

## Configuração local

### Pré-requisitos

- Node.js 20+
- projeto Supabase configurado
- acesso ao SQL Editor do Supabase
- conta SMTP válida para recovery e alertas

### Instalação

```bash
npm install
cp .env.example .env.local
```

### Variáveis de ambiente

Preencha `.env.local` com os valores do ambiente:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
ADMIN_SECRET=segredo-forte
NEXT_PUBLIC_API_URL=http://localhost:3000
PRIMARY_ADMIN_EMAIL=
NODE_ENV=development
ALLOW_DEV_2FA_FALLBACK=false
NEXT_PUBLIC_THEME=zucato
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

RECOVERY_SMTP_HOST=smtp.gmail.com
RECOVERY_SMTP_PORT=587
RECOVERY_SMTP_USER=zucatorecovery@gmail.com
RECOVERY_SMTP_PASS=senha-de-app-ou-deixe-vazio-se-usar-oauth
RECOVERY_SMTP_FROM="Clinica Zucato <zucatorecovery@gmail.com>"
RECOVERY_SMTP_OAUTH_CLIENT_ID=
RECOVERY_SMTP_OAUTH_CLIENT_SECRET=
RECOVERY_SMTP_OAUTH_REFRESH_TOKEN=
RECOVERY_SMTP_OAUTH_ACCESS_TOKEN=

SECURITY_ALERT_SMTP_HOST=
SECURITY_ALERT_SMTP_PORT=587
SECURITY_ALERT_SMTP_USER=
SECURITY_ALERT_SMTP_PASS=
SECURITY_ALERT_SMTP_FROM=
SECURITY_ALERT_SMTP_OAUTH_CLIENT_ID=
SECURITY_ALERT_SMTP_OAUTH_CLIENT_SECRET=
SECURITY_ALERT_SMTP_OAUTH_REFRESH_TOKEN=
SECURITY_ALERT_SMTP_OAUTH_ACCESS_TOKEN=
SECURITY_ALERT_EMAILS=zucatorecovery@gmail.com
```

Observações importantes:

- `PRIMARY_ADMIN_EMAIL` é opcional e pode ser usado como fallback de governança inicial.
- se `SECURITY_ALERT_SMTP_*` ficar vazio, o sistema reaproveita automaticamente o perfil `RECOVERY_SMTP_*`.
- o código ainda aceita `SMTP_*` como fallback legado, mas o padrão recomendado agora é usar os blocos `RECOVERY_SMTP_*` e `SECURITY_ALERT_SMTP_*`.
- para Gmail, a senha comum da conta não funciona no SMTP. Use senha de app ou OAuth2.
- em desenvolvimento, `ALLOW_DEV_2FA_FALLBACK=true` só deve ser usado quando você conscientemente quiser pular a entrega real de email. Para validar SMTP de verdade, mantenha `false`.

### Banco de dados

No SQL Editor do Supabase, aplique:

1. `database.sql`
2. `scripts/migration-rating-scale.sql`
3. `scripts/migration-page-views.sql`
4. `scripts/migration-device-fingerprint.sql`
5. `scripts/migration-dentist-feedback.sql`
6. `scripts/migration-admin-management.sql`
7. `scripts/migration-dashboard-analytics.sql`
8. `scripts/migration-anonymous-feedback.sql`
9. `scripts/migration-security-input-events.sql`
10. `scripts/migration-mixed-sentiment.sql`

Notas:

- `migration-admin-management.sql` habilita a hierarquia `owner` e `admin`.
- `migration-dashboard-analytics.sql` adiciona objetos auxiliares usados para analytics mais eficientes, com fallback compatível quando ainda não aplicados.
- `migration-anonymous-feedback.sql` anonimiza o histórico e reforça a policy pública.
- `migration-security-input-events.sql` habilita a trilha persistente de auditoria.
- `migration-mixed-sentiment.sql` alinha o banco com a categoria `misto`.

### Primeiro acesso administrativo

Crie ou atualize o primeiro admin:

```bash
node scripts/create-admin.js
```

Se o email já existir no Supabase Auth, o script reaproveita a conta e atualiza a senha.

Se precisar limpar completamente um usuário de testes:

```bash
npm run reset-admin-email -- email@dominio.com
```

### Execução local

```bash
npm run dev
```

Checklist mínimo após subir a aplicação:

1. enviar um feedback em `/`
2. validar login em `/autumn/login`
3. concluir ou validar o TOTP
4. testar `Esqueci minha senha`
5. abrir `/autumn/audit`
6. revisar métricas, feedbacks e painel de contas

## Auth, recovery e segurança

### Modelo de autenticação

- autenticação: Supabase Auth SSR
- autorização: tabela `admins`
- MFA: TOTP
- rotas mascaradas: `/autumn/login` e `/autumn/audit`
- `/admin/*` não deve existir como rota pública funcional

### Recovery de senha

Fluxo atual:

1. o admin solicita recovery na tela de login
2. o sistema envia um link por email
3. o link retorna para `/autumn/login?mode=recovery`
4. o app troca `code` ou tokens do link por sessão válida
5. a nova senha é salva com `updateUser`

### Emails operacionais

- `RECOVERY_SMTP_*`: envio de recovery e mensagens de auth
- `SECURITY_ALERT_SMTP_*`: envio de alertas operacionais de segurança
- `SECURITY_ALERT_EMAILS`: destinatários de alertas

Se o provedor Microsoft 365 ou Outlook responder `535 5.7.139 Authentication unsuccessful, basic authentication is disabled`, use OAuth2 ou uma forma de credencial compatível com o tenant. Para Gmail, prefira senha de app ou OAuth2.

### Proteções ativas

- rate limit com Upstash opcional e fallback em memória
- centralização de validação e detecção de payload suspeito
- bloqueio com `400` para entradas suspeitas
- auditoria persistente dos bloqueios no dashboard
- alertas por email para falhas repetidas de login, MFA e recovery
- cache curto de analytics no servidor

### Feedback público

- o fluxo não coleta mais identificação do paciente
- qualquer `patient_name` enviado pela UI pública é ignorado
- o banco deve permanecer alinhado com `is_anonymous = true` e `patient_name IS NULL`

## Testes e scripts úteis

### Scripts de operação

```bash
node scripts/check-config.js
node scripts/create-admin.js
npm run reset-admin-email -- email@dominio.com
```

### Scripts de validação

```bash
npm run build
node scripts/test-supabase.js
node scripts/test-api.js
npm run test-recovery-email -- --verify-only
npm run test-recovery-email -- --send admin@dominio.com
npm run test-recovery-email -- --profile security-alert --verify-only
npm run test-recovery-email -- --profile security-alert --send alertas@dominio.com
npm run test-bruteforce-alert -- --real-login --email admin@dominio.com --password senha-errada --attempts 5
npm run test-sql-injection-protection
npm run test-sql-injection-protection -- --dentist "Dr Guto"
```

O teste de brute force em modo `--real-login` usa tentativas reais contra o Supabase Auth antes de reportar o evento para o agregador de alertas.

## Deploy

### Pré-deploy

1. aplicar schema e migrations no Supabase
2. configurar as variáveis do ambiente de produção
3. validar `npm run build`
4. validar login, TOTP, recovery e dashboard
5. validar testes de SMTP e de proteção de input

### Produção

O projeto está preparado para deploy em plataformas como Vercel. Depois do deploy:

1. ajuste `NEXT_PUBLIC_API_URL` para a URL final
2. atualize `Site URL` e `Redirect URLs` no Supabase Auth
3. confira credenciais SMTP e destinatários de alerta
4. confirme que as rotas administrativas públicas continuam apenas em `/autumn/*`

## Tema e branding

O tema ativo é definido por `NEXT_PUBLIC_THEME`. A infraestrutura de personalização continua disponível em `lib/themes.ts`, `lib/useTheme.ts` e `components/ThemeProvider.tsx`.

## Documentos mantidos

- `README.md`: guia operacional consolidado
- `CHANGELOG.md`: histórico de versões e mudanças
- `LEGACY_AUTH_NOTES.md`: referência histórica do fluxo de auth antigo

- `MAJOR`: quebra compatibilidade
- `MINOR`: adiciona funcionalidades compatíveis
- `PATCH`: corrige bugs sem alterar o contrato esperado

Esta release foi marcada como `1.1.0` porque consolida várias funcionalidades novas sem exigir ruptura estrutural de uso do produto.

## Próximos passos sugeridos

- NPS e CSAT por atendimento, dentista e período
- exportação CSV/XLSX com filtros salvos no dashboard
- respostas internas a feedbacks com workflow de resolução
- trilha de auditoria para ações administrativas sensíveis
- monitoramento com Sentry e alertas operacionais por falha de API
- dashboard com coortes por origem, dentista e horário de atendimento
- fila de follow-up para avaliações negativas críticas
- métricas de conversão entre visualização, envio e abandono do formulário
- painéis comparativos por unidade, caso a clínica expanda para múltiplas unidades
