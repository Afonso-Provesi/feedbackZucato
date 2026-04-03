# Changelog

Este histórico foi consolidado a partir do estado atual do código, do changelog existente e dos marcos explícitos encontrados no Git. O repositório não possui tags publicadas para todas as versões antigas, então as entradas anteriores a `1.1.0` representam marcos reconstruídos do projeto.

## 1.2.6 - 2026-04-02

### Changed

- documentação operacional unificada em `README.md`
- versão declarada do projeto alinhada ao estado atual do repositório
- histórico de versões consolidado neste arquivo

### Fixed

- normalização de comentários durante a digitação para preservar espaços e quebras de linha sem relaxar a sanitização do submit
- inconsistências entre a documentação antiga de setup, deploy, auth, segurança e a implementação real

## 1.2.4 - 2026-04-01

### Added

- alertas agregados de brute force, falhas de MFA e abuso de recovery
- perfis SMTP separados para recovery e alertas de segurança
- validação e teste operacional de recovery email com suporte a Gmail e OAuth2
- painel administrativo para auditoria de entradas suspeitas

### Changed

- rate limit evoluído para suportar Upstash Redis com fallback em memória
- analytics do dashboard com cache curto e suporte a objetos SQL auxiliares
- endurecimento do mascaramento das rotas administrativas em `/autumn/*`

### Fixed

- fluxos de recovery por link e estabelecimento de sessão após redefinição de senha
- reaproveitamento de usuários já existentes no Supabase Auth durante criação de admins
- compatibilidade com tenants SMTP que recusam autenticação básica

## 1.1.0 - 2026-03-31

### Added

- autenticação administrativa com Supabase Auth SSR
- MFA TOTP no fluxo administrativo
- recovery e redefinição de senha pelo login administrativo
- gestão de contas administrativas pelo dashboard
- reset completo de emails de admin para testes
- avaliação separada para clínica e dentista
- analytics por dentista
- rastreamento de page views
- respostas públicas totalmente anônimas com reforço por policy e constraint
- auditoria persistente de entradas bloqueadas por payload suspeito
- script de teste para validar bloqueio contra payloads suspeitos

### Changed

- dashboard administrativo consolidado em `/autumn/audit`
- login administrativo consolidado em `/autumn/login`
- script de criação de admin passou a reaproveitar usuário existente e atualizar a senha
- fluxo público deixou de coletar identificação do paciente

### Fixed

- reutilização de email já existente no Supabase Auth
- compatibilidade com banco ainda sem coluna `role`
- validação imediata de sessão após login
- preparação explícita da sessão de recovery antes de alterar a senha
- persistência opcional de eventos suspeitos sem quebrar ambientes ainda sem migration aplicada

## 1.0.0 - 2026-03-30

### Added

- baseline estável do sistema de feedback público e dashboard administrativo
- formulário de feedback com escala ampliada e suporte a comentários
- coleta de page views e métricas básicas de uso
- suporte inicial a múltiplos temas por clínica

### Changed

- endurecimento progressivo de segurança no backend e nas rotas administrativas
- evolução do deploy e da configuração para ambiente hospedado

## 0.5.0 - 2026-03-29

### Added

- sistema de temas e branding por clínica

## 0.4.0 - 2026-03-29

### Added

- rastreamento de page views e estatísticas de visitantes com filtro por data

## 0.3.0 - 2026-03-29

### Added

- filtro por data no dashboard

### Changed

- escala de avaliação alterada de `1-5` para `0-10`

## 0.2.0 - 2026-03-29

### Added

- ajustes iniciais de deploy e configuração para hospedagem

## 0.1.0 - 2026-03-29

### Added

- primeira versão funcional do projeto
- formulário público de feedback
- dashboard administrativo inicial
- base de deploy para Next.js + Supabase
