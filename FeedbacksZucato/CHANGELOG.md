# Changelog

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
- script de teste real para validar bloqueio contra SQL injection
- alertas por email para brute force, falhas de MFA e abuso de recovery

### Changed

- dashboard administrativo consolidado em `/autumn/audit`
- login administrativo consolidado em `/autumn/login`
- análise de sentimento agora considera texto, nota e identifica comentários mistos com prós e contras para destaque gerencial
- script de criação de admin agora reaproveita usuário existente e atualiza a senha
- documentação reescrita para refletir o estado atual do sistema
- fluxo público não coleta mais identificação do paciente

### Fixed

- reutilização de email já existente no Supabase Auth
- compatibilidade com banco ainda sem coluna `role`
- validação imediata de sessão após login
- preparação explícita da sessão de recovery antes de alterar a senha
- persistência opcional de eventos suspeitos sem quebrar ambientes ainda sem migration aplicada
