# Guia de Migração para Supabase Auth

Este projeto agora usa Supabase Auth para login administrativo e MFA TOTP com aplicativo autenticador.

## O que mudou

- O login administrativo não usa mais senha validada na API caseira.
- A sessão do admin agora é a sessão oficial do Supabase Auth.
- O segundo fator agora é TOTP, usando Google Authenticator, Microsoft Authenticator, 1Password ou similar.
- A tabela `admins` continua sendo usada para autorizar quem pode acessar o dashboard.
- O script `node scripts/create-admin.js` agora cria o usuário no Supabase Auth e garante o registro em `admins`.
- A aplicação agora compara o hash SHA-256 do email na tabela `admins`; o email real fica apenas no Supabase Auth.

## Pré-requisitos

No arquivo `.env.local`, mantenha estas variáveis válidas:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

## Configuração no site do Supabase

### 1. Conferir chaves do projeto

No painel do Supabase:

1. Abra `Project Settings`.
2. Vá para `Data API` ou `API Keys`, conforme a versão do painel.
3. Copie:
   - `Project URL` para `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` para `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` para `SUPABASE_SERVICE_ROLE_KEY`

### 2. Configurar Email/Password

No painel do Supabase:

1. Abra `Authentication`.
2. Vá em `Providers`.
3. Abra `Email`.
4. Deixe `Enable Email provider` ativado.
5. Desative `Enable email signups`.

Observação:
- Como este painel é só para administradores, o ideal é impedir cadastro público.
- Os admins devem ser criados pelo script local ou manualmente pelo dashboard com privilégio de administrador.

### 3. Configurar URL da aplicação

No painel do Supabase:

1. Abra `Authentication`.
2. Vá em `URL Configuration`.
3. Configure:
   - `Site URL`: `http://localhost:3000` no desenvolvimento
   - Em produção, troque para a URL final do projeto
4. Em `Redirect URLs`, adicione:
   - `http://localhost:3000/*`
   - a URL de produção, quando existir

### 4. Conferir MFA TOTP

No painel do Supabase:

1. Abra `Authentication`.
2. Procure a seção `Multi-Factor Authentication` ou `MFA`.
3. Confirme que `TOTP` está habilitado.

Observação:
- Em muitos projetos Supabase, TOTP já vem disponível por padrão.
- O usuário faz a configuração do autenticador no primeiro login, dentro da própria interface do projeto.

## Criar o primeiro admin

No terminal do projeto:

```bash
node scripts/create-admin.js
```

O script faz duas coisas:

1. Cria o usuário em `Auth > Users` no Supabase.
2. Garante o registro correspondente na tabela `admins`.

## Gerenciar admins pelo dashboard

Depois que existir pelo menos um admin autenticado:

1. Acesse `/autumn/audit`.
2. Abra a seção `Contas Administrativas` no topo do dashboard.
3. Cadastre o email do novo admin.
4. O sistema vai:
    - criar ou reutilizar o usuário em `Auth > Users`
    - registrar o email permitido na tabela `admins`
    - gerar um link de definição de senha
5. Copie esse link e envie ao novo admin.

Você também pode:

- ativar ou desativar contas admins
- gerar um novo link de definição de senha
- visualizar quais registros ainda são legados e não têm vínculo completo com Supabase Auth

## Migração do schema

Para habilitar a gestão completa de admins no dashboard, execute no SQL Editor do Supabase:

```sql
-- arquivo: scripts/migration-admin-management.sql
ALTER TABLE admins
   ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE,
   ADD COLUMN IF NOT EXISTS invited_by_email VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_admins_auth_user_id ON admins(auth_user_id);

DO $$
BEGIN
   IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
         AND table_name = 'admins'
         AND column_name = 'raw_email'
   ) THEN
      UPDATE admins
      SET raw_email = NULL;

      BEGIN
         ALTER TABLE admins DROP COLUMN raw_email;
      EXCEPTION
         WHEN undefined_column THEN NULL;
      END;
   END IF;
END $$;
```

Importante:
- O email informado no script é o email que fará login no painel.
- A tabela `admins` usa apenas o hash SHA-256 do email para autorização.
- O email real permanece somente no Supabase Auth, que precisa dele para autenticação e recuperação de senha.
- Os novos registros armazenam `auth_user_id` para permitir gestão visual e automação sem persistir email bruto na tabela de admins.

## Fluxo do primeiro login

1. Acesse `/autumn/login`.
2. Faça login com email e senha do usuário criado no Supabase Auth.
3. Se for o primeiro acesso sem TOTP configurado:
   - a tela mostrará um QR Code
   - escaneie com seu app autenticador
   - digite o código de 6 dígitos
4. Após isso, os próximos logins pedem o código do autenticador em vez de email 2FA.

## Como funciona a autorização de admin

Autenticação:
- Feita pelo Supabase Auth.

Autorização:
- Feita pela tabela `admins`.

Regra atual:
- o usuário precisa estar autenticado no Supabase
- o email dele precisa existir na tabela `admins`
- o admin precisa estar com `is_active = true`

## Se você já tinha admins antigos

Se já existia um registro na tabela `admins` do sistema antigo:

1. Crie no Supabase Auth um usuário com o mesmo email real.
2. Use o script `node scripts/create-admin.js` com esse mesmo email.
3. O script faz `upsert` na tabela `admins`, então o vínculo compatível é preservado.

## Teste recomendado

1. Rode `npm run dev`.
2. Crie um admin pelo script.
3. Acesse `/autumn/login`.
4. Valide o fluxo de senha.
5. Valide a configuração inicial do autenticador.
6. Faça logout.
7. Faça novo login e valide o desafio TOTP.

## O que ficou legado

As rotas antigas abaixo foram desativadas e não devem mais ser usadas:

- `/api/auth/login`
- `/api/auth/2fa`

O login agora acontece diretamente pela interface usando Supabase Auth.

O código legado foi mantido no repositório de propósito:

- para comparação entre a abordagem manual e a migração para Supabase Auth
- para demonstrar a evolução arquitetural do projeto
- para referência histórica e apresentação em portfólio/currículo

Veja também [LEGACY_AUTH_NOTES.md](LEGACY_AUTH_NOTES.md).

## Próximos endurecimentos recomendados

1. Migrar a tabela `admins` para guardar também o `auth.users.id` e não depender de email hash como fallback.
2. Remover código legado de JWT/cookies próprios depois que o novo fluxo estiver estabilizado.
3. Revisar documentação antiga que ainda menciona bcrypt e login caseiro.