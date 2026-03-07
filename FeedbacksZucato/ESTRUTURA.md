# Estrutura do Projeto - Clínica Odontológica Zucato

```
zucato-feedback/
│
├── 📁 app/                                  # App directory (Next.js 14)
│   ├── 📁 api/                             # APIs REST
│   │   ├── 📁 admin/
│   │   │   ├── 📁 evolution/
│   │   │   │   └── route.ts                # GET evolução de avaliações
│   │   │   ├── 📁 feedbacks/
│   │   │   │   └── route.ts                # GET feedbacks com filtros
│   │   │   └── 📁 stats/
│   │   │       └── route.ts                # GET estatísticas gerais
│   │   ├── 📁 auth/
│   │   │   ├── 📁 check/
│   │   │   │   └── route.ts                # GET verificar autenticação
│   │   │   ├── 📁 login/
│   │   │   │   └── route.ts                # POST autenticar admin
│   │   │   └── 📁 logout/
│   │   │       └── route.ts                # POST fazer logout
│   │   └── 📁 feedback/
│   │       └── route.ts                    # POST submeta feedback
│   │
│   ├── 📁 admin/                           # Área administrativa
│   │   ├── 📁 dashboard/
│   │   │   └── page.tsx                    # Dashboard principal
│   │   ├── 📁 login/
│   │   │   └── page.tsx                    # Página de login
│   │   └── layout.tsx                      # Layout admin com autenticação
│   │
│   ├── 📁 obrigado/                        # Página de agradecimento
│   │   └── page.tsx
│   │
│   ├── layout.tsx                          # Layout raiz
│   ├── globals.css                         # Estilos globais
│   └── page.tsx                            # Página inicial / Feedback
│
├── 📁 components/                          # Componentes React reutilizáveis
│   ├── DashboardCards.tsx                  # Cards com estatísticas
│   ├── DashboardCharts.tsx                 # Gráficos (pizza + linha)
│   ├── FeedbackForm.tsx                    # Formulário de feedback
│   ├── FeedbackTable.tsx                   # Tabela com feedback
│   └── StarRating.tsx                      # Componente de 5 estrelas
│
├── 📁 lib/                                 # Bibliotecas e utilitários
│   ├── auth.ts                             # Funções de autenticação (JWT)
│   ├── security.ts                         # Segurança (hash, sanitize, rate limit)
│   ├── sentiment.ts                        # Análise de sentimento
│   └── supabase.ts                         # Cliente Supabase e queries
│
├── 📁 scripts/                             # Scripts de automação
│   └── create-admin.js                     # Script para criar admin
│
├── 📁 public/                              # Arquivos estáticos
│   └── (para favicons, imagens, etc)
│
├── 📄 .env.example                         # Template de variáveis
├── 📄 .gitignore                           # Ignora arquivos sensíveis
├── 📄 database.sql                         # Schema PostgreSQL
├── 📄 DEPLOYMENT.md                        # Guia de deployment
├── 📄 ESPECIFICACAO.md                     # Especificação completa
├── 📄 generate-secret.sh                   # Gera ADMIN_SECRET
├── 📄 next.config.js                       # Configuração Next.js
├── 📄 package.json                         # Dependências
├── 📄 postcss.config.js                    # PostCSS config
├── 📄 README.md                            # Documentação principal
├── 📄 SETUP.md                             # Guia de setup local
├── 📄 tailwind.config.js                   # Tailwind CSS config
└── 📄 tsconfig.json                        # TypeScript config
```

---

## 📋 Estrutura de Páginas e Rotas

```
/                       → Página de Feedback (público)
└── Como foi sua experiência?
    ├── Avaliação (1-5 estrelas)
    ├── Comentário opcional
    ├── Anônimo vs Nome
    └── Botão Enviar
        ↓
/obrigado               → Página de Agradecimento

/admin/login            → Login (público mas protegido)
└── Requer autenticação
    ↓
/admin/dashboard        → Dashboard (protegido)
├── Cards de estatísticas
├── Gráficos
└── Tabela com filtros
```

---

## 🔌 Estrutura de APIs

```
POST /api/feedback
├── Validação de rating (1-5)
├── Sanitização de inputs
├── Análise de sentimento
└── Salva no Supabase

POST /api/auth/login
├── Valida email/senha
├── Gera JWT
└── Seta cookie httpOnly

GET /api/auth/check
└── Valida sessão atual

GET /api/admin/stats (protegido)
└── Retorna: avgRating, total, positives%, negatives%

GET /api/admin/evolution (protegido)
└── Retorna: evolução diária (últimos 30 dias)

GET /api/admin/feedbacks (protegido)
└── Retorna: feedbacks com filtros por sentimento
```

---

## 🎨 Cores e Componentes

```
Brand Colors:
├── Azul: #1F1D6B (primário)
├── Dourado: #B0743C (acentos)
└── Branco: #FFFFFF (fundo)

Componentes:
├── StarRating
│   ├── 5 estrelas interativas
│   └── Douradas ao selecionadas
│
├── FeedbackForm
│   ├── Textarea
│   ├── Radio buttons (anônimo)
│   ├── Input condicional (nome)
│   └── Button submit
│
├── DashboardCards
│   ├── Card Média
│   ├── Card Total
│   ├── Card Positivos
│   └── Card Negativos
│
├── DashboardCharts
│   ├── Pie Chart (sentimentos)
│   └── Line Chart (evolução)
│
└── FeedbackTable
    ├── Filtros por sentimento
    └── Tabela com 5 colunas
```

---

## 🗄️ Banco de Dados (Supabase)

```
Tabelas:
│
├── feedbacks
│   ├── id (UUID, PK)
│   ├── rating (INT, 1-5)
│   ├── comment (TEXT)
│   ├── sentiment (VARCHAR: positivo|negativo|neutro)
│   ├── created_at (TIMESTAMP)
│   ├── is_anonymous (BOOLEAN)
│   ├── patient_name (VARCHAR)
│   └── source (VARCHAR: whatsapp)
│
└── admins
    ├── id (UUID, PK)
    ├── email (VARCHAR, UNIQUE)
    ├── password_hash (VARCHAR)
    ├── created_at (TIMESTAMP)
    └── is_active (BOOLEAN)

Índices:
├── feedbacks(created_at DESC)
├── feedbacks(sentiment)
├── feedbacks(rating)
└── admins(email)
```

---

## 🔐 Fluxo de Segurança

```
Usuário → Submete Feedback
    ↓
[Rate Limit Check] → IP bloqueado por 60s se >10 req/min
    ↓
[Input Validation] → Rating deve ser 1-5
    ↓
[Sanitize] → Remove tags HTML, caracteres perigosos
    ↓
[Sentiment Analysis] → Keywords para classificação
    ↓
[Save to DB] → Insert com RLS policies
    ↓
Feedback Salvo ✓

Login Admin → Email + Senha
    ↓
[Validate Email] → Formato válido
    ↓
[Verify Password] → Bcrypt compare
    ↓
[Generate JWT] → Token 24h
    ↓
[Set Cookie] → httpOnly, secure, sameSite
    ↓
[Redirect] → /admin/dashboard
    ↓
Admin Autenticado ✓
```

---

## 📦 Dependências Principais

```
package.json Dependencies:
├── Framework
│   ├── next@14.0.0
│   └── react@18.2.0
├── UI/Styling
│   ├── tailwindcss@3.3.0
│   └── react-hot-toast@2.4.1
├── Charts
│   ├── chart.js@4.4.0
│   └── react-chartjs-2@5.2.0
├── Backend
│   ├── @supabase/supabase-js@2.38.0
│   ├── jose@5.1.0 (JWT)
│   └── bcryptjs@2.4.3 (Hashing)
└── Security
    ├── dompurify@3.0.6
    └── isomorphic-dompurify@2.3.0
```

---

## 🚀 Scripts Disponíveis

```bash
npm run dev          # Inicia dev server (localhost:3000)
npm run build        # Build otimizado para produção
npm start            # Inicia server de produção
npm run lint         # Verifica lint

node scripts/create-admin.js    # Cria novo admin interativamente
bash generate-secret.sh          # Gera ADMIN_SECRET seguro
```

---

## 📈 Fluxo de Dados

```
Cliente (WhatsApp Link)
    ↓
    ├→ Feedback Page (/)
    │   ├─→ StarRating (componente)
    │   ├─→ Textarea
    │   ├─→ Anônimo radio
    │   └─→ Submit Button
    │       ↓
    │       POST /api/feedback
    │       ↓
    │       [Supabase feedbacks table]
    │       ↓
    │       Redirect /obrigado
    │
    └→ Admin (Dashboard)
        ↓
        /admin/login
            ↓
            POST /api/auth/login
            ↓
            [JWT + Cookie]
            ↓
            /admin/dashboard
                ↓
                GET /api/admin/stats
                GET /api/admin/evolution
                GET /api/admin/feedbacks
                ↓
                [Render Charts & Tables]
```

---

## 📋 Tipos de Dados Principais

```typescript
// Feedback submetido
interface FeedbackInput {
  rating: number           // 1-5
  comment?: string         // Até 500 caracteres
  isAnonymous: boolean     // true | false
  patientName?: string     // Até 100 caracteres
  source: string           // 'whatsapp'
}

// Feedback salvo
interface Feedback {
  id: string               // UUID
  rating: number
  comment: string | null
  sentiment: 'positivo' | 'negativo' | 'neutro' | null
  created_at: string       // ISO timestamp
  is_anonymous: boolean
  patient_name: string | null
  source: string
}

// Admin JWT
interface AdminPayload {
  id: string
  email: string
  iat: number
  exp: number
}
```

---

**Versão:** 1.0
**Data:** 7 de março de 2026
**Status:** ✅ Pronto para desenvolvimento
