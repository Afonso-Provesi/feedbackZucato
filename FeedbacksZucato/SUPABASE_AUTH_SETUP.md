# Guia de Supabase Auth

O projeto usa Supabase Auth para autenticação administrativa e a tabela `admins` para autorização ao dashboard.

## Modelo atual

- autenticação: Supabase Auth
- autorização: tabela `admins`
- segundo fator: TOTP MFA
- recovery: link `recovery` do Supabase
- rotas administrativas:
  - `/autumn/login`
  - `/autumn/audit`

## Configuração recomendada no Supabase

### Email provider

- habilitar `Email`
- desabilitar cadastro público por email se o painel for exclusivo para admins

### URL Configuration

Desenvolvimento:

- `Site URL`: `http://localhost:3000`
- `Redirect URLs`: `http://localhost:3000/*`

Produção:

- atualizar para o domínio final

### MFA

Confirmar que `TOTP` está habilitado.

## Criação de admins

### Via script

```bash
node scripts/create-admin.js
```

O script:

- cria ou reaproveita usuário no Auth
- atualiza a senha quando o usuário já existe
- cria ou atualiza vínculo na tabela `admins`

### Via dashboard

O painel administrativo permite:

- cadastrar admins
- gerar novo link de definição de senha
- ativar ou desativar contas

## Reset para testes

```bash
npm run reset-admin-email -- email@dominio.com
```

## Migration de gestão de admins

Para liberar papéis `owner` e `admin`, execute:

```sql
-- scripts/migration-admin-management.sql
```

Sem essa migration, o sistema continua funcionando em modo compatível.

## Fluxo de login

1. usuário entra com email e senha
2. sistema valida sessão no Supabase
3. sistema confirma autorização na tabela `admins`
4. se necessário, exige MFA TOTP

## Fluxo de recovery

1. gerar link de recovery
2. abrir `/autumn/login?mode=recovery`
3. sistema estabelece sessão a partir do `code` ou dos tokens do link
4. nova senha é salva com `updateUser`

## Observação prática

Se um email foi apagado de `admins` mas continua “existindo”, ele ainda está em `Auth > Users`. Para limpar o estado inteiro de teste, use `reset-admin-email`.
