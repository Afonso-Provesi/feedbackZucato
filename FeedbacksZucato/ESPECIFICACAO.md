# Especificação Completa do Projeto - Clínica Odontológica Zucato

## 📋 Contexto

Projeto web para coleta e análise de feedback de pacientes da Clínica Odontológica Zucato. O sistema permite que pacientes avaliem suas experiências através de links compartilhados via WhatsApp após consultas.

## 🎨 Identidade Visual

### Cores Principais
- **Azul Institucional:** `#1F1D6B` - Cor primária da marca
- **Dourado:** `#B0743C` - Cor secundária/acentos
- **Branco:** `#FFFFFF` - Fundo principal

### Características de Design
- Minimalista e elegante
- Profissional e acessível
- Mobile-first responsivo
- Container central com máximo 480px de largura
- Interface intuitiva e de fácil uso

## ✨ Funcionalidades Implementadas

### FUNCIONALIDADE 1 - Página de Feedback

**URL:** `/`

**Componentes:**
- Logo da clínica no topo (ícone com letra "Z")
- Título: "Clínica Odontológica Zucato"
- Pergunta principal: "Como foi sua experiência conosco hoje?"

**Sistema de Avaliação:**
- 5 estrelas interativas ⭐
- Estrelas douradas (`#B0743C`) ao selecionar
- Hover effects para melhor UX
- Armazena rating de 1 a 5

**Campo de Comentário:**
- Textarea opcional
- Placeholder: "Quer nos contar um pouco mais sobre sua experiência?"
- Máximo 500 caracteres
- Sanitizado contra XSS

**Opção de Anonimato:**
- Radio buttons para seleção:
  - "Enviar anonimamente" (padrão)
  - "Informar nome"
- Se selecionado "Informar nome", exibe campo de entrada

**Campo de Nome (Condicional):**
- Placeholder: "Seu nome (opcional)"
- Máximo 100 caracteres
- Apenas visível quando "Informar nome" está selecionado

**Botão de Envio:**
- Texto: "Enviar avaliação"
- Fundo azul institucional
- Desabilitado durante envio
- Animação de carregamento

**Comportamento:**
- Valida avaliação obrigatória
- Mostra toasts de sucesso/erro
- Redireciona para `/obrigado` após 1.5s

---

### FUNCIONALIDADE 2 - Página de Agradecimento

**URL:** `/obrigado`

**Componentes:**
- Ícone de sucesso (check mark verde)
- Mensagem: "Agradecemos muito seu feedback!"
- Mensagem secundária: "Sua opinião é muito importante para melhorarmos cada vez mais nossos serviços."
- Link "Voltar" para página inicial

**Design:**
- Card branco com sombra
- Centrado na tela
- Responsive

---

### FUNCIONALIDADE 3 - API de Feedback

**Endpoint:** `POST /api/feedback`

**Validações:**
- Rating deve estar entre 1 e 5
- Inputs sanitizados contra XSS
- Rate limiting: 10 requisições por minuto por IP

**Dados Salvos no Banco:**
```
{
  id: UUID (gerado automaticamente),
  rating: number (1-5),
  comment: string | null (máx 500 chars),
  sentiment: 'positivo' | 'negativo' | 'neutro' | null,
  created_at: timestamp,
  is_anonymous: boolean,
  patient_name: string | null,
  source: 'whatsapp' (padrão)
}
```

**Análise Automática:**
- Se houver comentário, classifica sentimento automaticamente
- Resultado salvo na coluna `sentiment`

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": [...feedback criado...]
}
```

---

### FUNCIONALIDADE 4 - Análise de Sentimento

**Algoritmo:**
- Busca keywords-chave dentro de comentários
- Não diferencia maiúsculas/minúsculas
- Agrega pontos por categoria

**Palavras-chave Positivas:**
ótimo, excelente, maravilhoso, perfeito, adorei, amei, muito bom, recomendo, feliz, satisfeito, gostei, incrível, fantástico, legal, sensacional, espetacular, formidável, bom, agradável, bacana, demais, top, show, massa, maneiro, legal demais, super bom, muito legal, melhor

**Palavras-chave Negativas:**
ruim, péssimo, horrível, terrível, detestei, odiei, muito ruim, decepcionado, decepcionante, insatisfeito, problema, problemas, não gostei, desagradável, chato, chato demais, ruim demais, fraco, fraca, pior, decepção, demorado, lento, lenta, caro, muito caro, abusivo, inadequado, deficiente, falha, falhas, erro, erros

**Classificação:**
- **Positivo** 😊: mais keywords positivas
- **Negativo** 😞: mais keywords negativas
- **Neutro** 😐: empate ou sem keywords

---

### FUNCIONALIDADE 5 - Dashboard Administrativo

**URL:** `/admin/dashboard`

**Autenticação:**
- Login acessível em `/admin/login`
- Email e senha obrigatórios
- Sessão com JWT
- Cookie httpOnly, secure, sameSite=strict
- Validade de 24 horas

**Cards de Estatísticas:**

1. **Média de Avaliações**
   - Exibe média das ratings (ex: 4.3)
   - Texto: "de 5 estrelas"
   - Borda azul-dourada

2. **Total de Avaliações**
   - Conta total de feedbacks
   - Texto: "feedbacks coletados"
   - Borda azul

3. **% Feedback Positivo**
   - Percentual de feedbacks com sentimento positivo
   - Exibe com cor verde
   - Texto: "satisfação"

4. **% Feedback Negativo**
   - Percentual de feedbacks com sentimento negativo
   - Exibe com cor vermelha
   - Texto: "insatisfação"

**Gráficos:**

1. **Gráfico de Pizza - Distribuição de Sentimentos**
   - Mostra divisão: Positivo (verde), Negativo (vermelho), Neutro (cinza)
   - Dados em tempo real
   - Chart.js Pie Chart

2. **Gráfico de Linha - Evolução Temporal**
   - X: Datas (últimos 30 dias)
   - Y: Média de avaliações por dia
   - Linha azul com pontos dourados
   - Chart.js Line Chart
   - Preenching (fill) com degradê

**Tabela de Feedbacks:**

**Colunas:**
- Data (format dd/mm/yyyy)
- Avaliação (com estrelas ⭐)
- Sentimento (badge com cor)
- Comentário (truncado a 60 caracteres)
- Nome do Paciente (ou "Anônimo" se is_anonymous=true)

**Filtros:**
- Botão: "Todos" (padrão)
- Botão: "Positivo" (sentiment='positivo')
- Botão: "Negativo" (sentiment='negativo')
- Botão: "Neutro" (sentiment='neutro')

**Comportamento:**
- Ao clicar filtro, faz requisição GET `/api/admin/feedbacks?sentiment=...`
- Atualiza tabela dinamicamente
- Ordenação decrescente por data

**Header do Dashboard:**
- Logo com "Z"
- Texto "Dashboard Zucato"
- Botão logout (vermelho)

---

## 🔒 Segurança Implementada

### 1. HTTPS e Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### 2. Validação de Inputs
- Whitelist de caracteres
- Trim e máximo de 5000 caracteres
- Validação de email (regex)
- Validação de rating (1-5)

### 3. Sanitização XSS
- Remoção de tags HTML `<>` perigosas
- Encoding de caracteres especiais `&<>"'`
- DOMPurify para dados dinâmicos

### 4. Hash de Senhas
- Bcryptjs com 10 rounds
- Geração segura com `hashPassword()`
- Verificação com `verifyPassword()`

### 5. Proteção de Rotas
- JWT para endpoint `/admin/*`
- Validação de token em cada requisição
- Refresh automático via cookie httpOnly

### 6. Rate Limiting
- 10 requisições por minuto por IP
- Verificação em `/api/feedback`
- Em-memory store (persistível com Redis em produção)

### 7. Autenticação Admin
- Email único
- Senha hasheada com Bcrypt
- JWT com expiração de 24 horas
- Cookie seguro (httpOnly, secure, sameSite)

---

## 📊 API Endpoints

### Públicos

**POST /api/feedback**
```
Body: {
  rating: number,
  comment?: string,
  isAnonymous: boolean,
  patientName?: string,
  source: string
}
```

### Autenticados (Admin)

**POST /api/auth/login**
```
Body: {
  email: string,
  password: string
}
```

**POST /api/auth/logout**
- Limpa cookie de autenticação

**GET /api/auth/check**
- Valida sessão atual

**GET /api/admin/stats**
```
Response: {
  total: number,
  avgRating: number,
  positivoPercent: string,
  negativoPercent: string,
  sentimentBreakdown: {
    positivo: number,
    negativo: number,
    neutro: number
  }
}
```

**GET /api/admin/evolution?days=30**
```
Response: [
  { date: "dd/mm/yyyy", media: "4.5" },
  ...
]
```

**GET /api/admin/feedbacks?sentiment=positivo**
```
Response: [
  {
    id: UUID,
    rating: number,
    comment: string,
    sentiment: string,
    created_at: timestamp,
    patient_name: string | null,
    is_anonymous: boolean
  },
  ...
]
```

---

## 📱 Integração WhatsApp

Para compartilhar link de feedback via WhatsApp:

```
Link básico:
https://seu-dominio.com/

Link com parâmetros:
https://seu-dominio.com/?utm_source=whatsapp&utm_campaign=feedback

Template de mensagem:
"Olá! 👋 Agradecemos sua visita à Clínica Odontológica Zucato. 
Gostaria que avaliasse sua experiência conosco?
[Link do feedback]"
```

---

## 🗄️ Estrutura do Banco de Dados

**Tabela: feedbacks**
- id (UUID, PK)
- rating (INTEGER, 1-5)
- comment (TEXT)
- sentiment (VARCHAR, positivo|negativo|neutro)
- created_at (TIMESTAMP)
- is_anonymous (BOOLEAN)
- patient_name (VARCHAR)
- source (VARCHAR)

**Índices:**
- created_at DESC (para ordenação)
- sentiment (para filtros)
- rating (para estatísticas)

**Tabela: admins**
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- created_at (TIMESTAMP)
- is_active (BOOLEAN)

---

## 🎯 Requisitos de Negócio

✅ Coleta de feedback simples e intuitiva
✅ Avaliação com sistema de estrelas
✅ Comentários opcionais
✅ Apoio a feedback anônimo
✅ Análise automática de sentimento
✅ Dashboard de visualização
✅ Estatísticas em tempo real
✅ Filtros por sentimento
✅ Design minimalista e profissional
✅ Compatibilidade mobile
✅ Integração WhatsApp
✅ Segurança máxima

---

## 📦 Dependências Principais

- **next** ^14.0.0
- **react** ^18.2.0
- **@supabase/supabase-js** ^2.38.0
- **tailwindcss** ^3.3.0
- **chart.js** ^4.4.0
- **bcryptjs** ^2.4.3
- **jose** ^5.1.0

---

## 🚀 Próximas Etapas Sugeridas

1. [ ] Backup automático de dados
2. [ ] Notificações por email ao receber feedback
3. [ ] Exportação de relatórios (PDF/CSV)
4. [ ] Duas camadas de autenticação (2FA)
5. [ ] Sistema de alertas para sentimentos negativos
6. [ ] Integração com CRM
7. [ ] Análise de tendências ao longo do tempo
8. [ ] Multi-idioma (português/inglês)

---

**Última atualização:** 7 de março de 2026
**Versão:** 1.0.0
**Status:** ✅ Production-ready
