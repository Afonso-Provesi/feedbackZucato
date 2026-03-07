# Checklist de Deployment - Clínica Odontológica Zucato

## ✅ Pré-Deployment (Desenvolvimento Local)

### Configuração Inicial
- [ ] Repositório Git criado e configurado
- [ ] `.env.local` criado com todas as variáveis
- [ ] `npm install` executado com sucesso
- [ ] `npm run dev` testado localmente

### Testes Funcionais
- [ ] Página de feedback carrega corretamente
- [ ] Formulário envia sem erros
- [ ] Redirecionamento para página de agradecimento funciona
- [ ] Dados aparecem no Supabase
- [ ] Análise de sentimento funciona
- [ ] Login administrativo autenticado
- [ ] Dashboard carrega com estatísticas
- [ ] Gráficos renderizam corretamente
- [ ] Filtros funcionam
- [ ] Logout funciona

### Segurança - Verificações Locais
- [ ] Rate limiting testado
- [ ] XSS bloqueado em comentários
- [ ] Validação de inputs funciona
- [ ] Senhas hasheadas no banco
- [ ] Cookies são httpOnly e secure
- [ ] Headers de segurança configurados

---

## 🔧 Database Setup (Supabase Production)

- [ ] Projeto criado no Supabase
- [ ] `database.sql` executado completamente
- [ ] Tabelas criadas: `feedbacks`, `admins`
- [ ] Índices criados
- [ ] RLS policies ativadas
- [ ] Backups automáticos configurados (retenção mínima 7 dias)
- [ ] Usuário admin criado com senha segura
- [ ] Teste de conexão bem-sucedido

---

## 📦 Build e Otimização

- [ ] `npm run build` executado sem erros
- [ ] Tamanho do bundle verificado
- [ ] Imagens otimizadas
- [ ] CSS purificado (Tailwind)
- [ ] JavaScript minificado
- [ ] Source maps desabilitados em produção

---

## 🌐 Configuração de Domínio

### Registrar Domínio
- [ ] Domínio registrado (ex: feedback.clinicazucato.com.br)
- [ ] DNS pointing corretamente
- [ ] A/AAAA records configurados

### SSL/HTTPS
- [ ] Certificado SSL obtido (Let's Encrypt)
- [ ] HTTPS funciona em todos os endpoints
- [ ] Redirecionamento HTTP → HTTPS ativado

---

## 🚀 Deploy (Vercel Recomendado)

### Vercel
```bash
npm install -g vercel
vercel login
vercel deploy --prod
```

- [ ] Conta Vercel criada
- [ ] Projeto conectado ao Git
- [ ] Variáveis de ambiente adicionadas:
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] ADMIN_SECRET (gerado novo)
  - [ ] NODE_ENV=production

### Alternativa: Netlify
- [ ] Conta Netlify criada
- [ ] Projeto conectado
- [ ] Build command: `npm run build`
- [ ] Publish directory: `.next`
- [ ] Variáveis configuradas

---

## 🔐 Segurança Pré-Produção

- [ ] ADMIN_SECRET alterado (mínimo 64 caracteres aleatórios)
- [ ] Senhas de banco de dados fortes
- [ ] Nenhuma credencial no GitHub
- [ ] CORS configurado corretamente
- [ ] Rate limits ajustados para produção
- [ ] Logs de erro configurados
- [ ] Backup de disaster recovery testado

---

## 📊 Monitoring e Analytics

- [ ] Google Analytics configurado (opcional)
- [ ] Sentry.io configurado para error tracking
- [ ] Logs de API armazenados
- [ ] Performance monitoring iniciado
- [ ] Alertas configurados para erros críticos

---

## 📧 Comunicação

- [ ] Pacientes receberão links de feedback via WhatsApp
- [ ] Template de mensagem aprovado pela clínica
- [ ] Suporte preparado para dúvidas

---

## 📋 Pós-Deployment

### Testes em Produção
- [ ] Página de feedback acessível e rápida
- [ ] Submissões salvas no banco corretamente
- [ ] Análise de sentimento funcionando
- [ ] Dashboard administrativo acessível
- [ ] Performance aceitável (< 2s para feedback)

### Monitoramento
- [ ] Revisar logs diários nos primeiros 7 dias
- [ ] Verificar taxa de erro
- [ ] Monitorar capacidade do banco
- [ ] Feedback dos usuários coletado

### Documentação
- [ ] README.md atualizado com URL de produção
- [ ] Manual de admin preparado
- [ ] Contatos de suporte divulgados
- [ ] Backup de documentação feito

---

## 🆘 Plano de Contingência

### Em caso de downtime
1. Verificar status do Vercel/Netlify
2. Verificar status do Supabase
3. Revisar logs de erro
4. Notificar clínica via email/WhatsApp
5. Implementar fix
6. Testar em staging
7. Redeploy

### Backup e Recovery
- [ ] Backup diário do banco ativo
- [ ] Snapshots do Supabase em retenção
- [ ] Scripts de restore testados
- [ ] Documentação de recovery escrita

---

## 📱 Distribuição de Links

### Links de Feedback
```
Produção: https://feedback.clinicazucato.com.br/
Admin: https://feedback.clinicazucato.com.br/admin/login
```

### Template WhatsApp (sugerido)
```
Olá ___ 👋

Muito obrigado por escolher a Clínica Odontológica Zucato para sua saúde bucal!

Para melhorarmos continuamente, gostaria que você avaliasse
sua experiência conosco:

👉 [LINK DO FEEDBACK]

Leva menos de 1 minuto ⏱️

Agradecemos sua confiança! 😊

Clínica Odontológica Zucato
📍 [Endereço]
📞 [Telefone]
```

---

## 🎉 Launch Checklist Final

- [ ] CEO/Gerente aprova deployment
- [ ] Equipe de atendimento notificada
- [ ] FAQ preparado
- [ ] Beta testers confirmam funcionamento
- [ ] Suporte de TI on-call
- [ ] Monitoramento ativ

ado
- [ ] Mensagem de boas-vindas pronta
- [ ] **LAUNCH! 🚀**

---

## 📈 Métricas de Sucesso (30 dias)

- [ ] Mínimo 100 feedbacks coletados
- [ ] Taxa de resposta > 20%
- [ ] Sentimento positivo > 80%
- [ ] Tempo de carregamento < 1s
- [ ] Zero erros não tratados
- [ ] Admin usando dashboard regularmente

---

## 🔄 Manutenção Contínua

### Semanal
- Verificar logs de erro
- Revisar sentiment negativo
- Confirmar backups

### Mensal
- Revisar estatísticas
- Otimizar performance
- Atualizar dependências (se seguro)

### Trimestral
- Audit de segurança
- Review de features
- Planejamento de melhorias

---

**Versão:** 1.0
**Última atualização:** 7 de março de 2026

### Perguntas e Suporte
Em caso de dúvidas durante o deployment, consulte SETUP.md e README.md.
