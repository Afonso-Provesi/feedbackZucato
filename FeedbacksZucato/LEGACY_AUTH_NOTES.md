# Notas Sobre o Auth Legado

Este projeto preserva parte do código de autenticação anterior como referência histórica.

## Objetivo

Esse código foi mantido para:

- mostrar a evolução do projeto entre auth manual e Supabase Auth
- servir como material de estudo e comparação arquitetural
- compor histórico técnico do projeto para portfólio/currículo

## O que é legado hoje

Os itens abaixo não são mais o fluxo principal de autenticação:

- [app/api/auth/login/route.ts](app/api/auth/login/route.ts)
- [app/api/auth/2fa/route.ts](app/api/auth/2fa/route.ts)
- parte dos helpers em [lib/auth.ts](lib/auth.ts)

## Como o fluxo antigo funcionava

O fluxo anterior fazia:

1. validação manual de email e senha
2. consulta à tabela `admins`
3. geração de JWT próprio para sessão administrativa
4. cookies próprios para autenticação
5. 2FA por email com challenge assinado
6. marcação de IP confiável por tempo limitado

## Como o fluxo atual funciona

O fluxo atual faz:

1. login com Supabase Auth
2. sessão SSR via cookies do Supabase
3. validação de autorização administrativa contra a tabela `admins`
4. MFA TOTP com aplicativo autenticador

## Status esperado

O código legado está:

- preservado
- comentado como legado
- desativado nas rotas públicas para evitar uso acidental em produção

## Observação

Se no futuro houver limpeza do repositório, a recomendação é manter este documento e registrar a remoção do legado em changelog ou documentação técnica.