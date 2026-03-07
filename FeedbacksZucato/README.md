# Clínica Odontológica Zucato - Sistema de Feedback

## 📋 Visão Geral

Sistema web completo para coleta, análise e visualização de feedback de pacientes da Clínica Odontológica Zucato. O sistema permite que pacientes avaliem suas experiências via links compartilhados por WhatsApp e oferece um dashboard administrativo com análises detalhadas.

## 🎨 Identidade Visual

- **Cores Principais:**
  - Azul Institucional: `#1F1D6B`
  - Dourado: `#B0743C`
  - Branco: `#FFFFFF`
- **Design:** Minimalista, elegante e profissional
- **Layout:** Mobile-first com máximo de 480px de largura

## 🚀 Stack Tecnológica

### Frontend
- **Next.js 14** - Framework React
- **React 18** - Biblioteca UI
- **TailwindCSS** - Estilos
- **Chart.js** - Gráficos interativos
- **React Hot Toast** - Notificações

### Backend
- **Supabase** - PostgreSQL + APIs
- **Next.js API Routes** - API REST
- **JWT (Jose)** - Autenticação
- **Bcrypt** - Hash de senhas

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Supabase

### Passo 1: Clonar repositório
```bash
git clone seu-repositorio
cd zucato-feedback
npm install
```

### Passo 2: Configurar variáveis de ambiente
```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
ADMIN_SECRET=um_secret_seguro_aleatorio
```

### Passo 3: Configurar banco de dados
1. Copie o conteúdo de `database.sql`
2. Acesse Supabase SQL Editor
3. Execute o SQL para criar as tabelas

### Passo 4: Criar usuário administrador
```sql
INSERT INTO admins (email, password_hash) VALUES (
  'admin@clinicazucato.com',
  'seu_hash_bcrypt_aqui'
);
```

Para gerar o hash, use:
```javascript
import { hashPassword } from '@/lib/security'
const hash = await hashPassword('sua_senha')
console.log(hash)
```

### Passo 5: Executar desenvolvimento
```bash
npm run dev
```

Acesse http://localhost:3000

## 🎯 Funcionalidades

### 1. Página Pública de Feedback
- Logo da clínica
- Pergunta: "Como foi sua experiência conosco hoje?"
- Sistema de avaliação com 5 estrelas (douradas)
- Campo de comentário opcional
- Opção de anonimato
- Campo de nome (condicional)
- Validação de inputs

**URL:** `http://localhost:3000`

### 2. Página de Agradecimento
- Mensagem de gratidão
- Link para voltar

**URL:** `http://localhost:3000/obrigado`

### 3. API de Feedback
- **Endpoint:** `POST /api/feedback`
- **Salva:** rating, comment, sentiment, created_at, is_anonymous, patient_name, source
- **Análise automática:** Classificação de sentimento (positivo/negativo/neutro)
- **Taxa limite:** 10 requisições por minuto por IP

### 4. Dashboard Administrativo
**URL:** `http://localhost:3000/admin/login`

#### Cards de Estatísticas:
- Média de avaliações
- Total de avaliações
- % Feedback positivo
- % Feedback negativo

#### Gráficos:
- Gráfico de pizza: Distribuição de sentimentos
- Gráfico de linha: Evolução temporal das avaliações

#### Tabela de Feedbacks:
- Data
- Avaliação (com estrelas)
- Sentimento
- Comentário
- Nome do paciente (ou Anônimo)
- **Filtros:** Todos, Positivos, Negativos, Neutros

## 🔒 Segurança

### Implementado:
- ✅ **HTTPS** - Headers de segurança configurados
- ✅ **Validação de inputs** - Whitelist de caracteres permitidos
- ✅ **Sanitização XSS** - Remoção de tags HTML perigosas
- ✅ **Hash de senhas** - Bcrypt com 10 rounds
- ✅ **Proteção de rotas** - JWT para admin
- ✅ **Rate limiting** - Limite de requisições por IP
- ✅ **Headers de segurança:**
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin

## 📊 Análise de Sentimento

O sistema classifica comentários automaticamente em:
- **Positivo** 😊 - Palavras-chave: ótimo, excelente, adorei, recomendo, etc.
- **Negativo** 😞 - Palavras-chave: ruim, péssimo, decepcionado, problema, etc.
- **Neutro** 😐 - Sem palavras-chave específicas

## 🤖 APIs Disponíveis

### Públicas
- `POST /api/feedback` - Submeter feedback

### Autenticadas (Admin)
- `GET /api/admin/stats` - Estatísticas gerais
- `GET /api/admin/evolution` - Evolução temporal
- `GET /api/admin/feedbacks` - Lista de feedbacks com filtros
- `POST /api/auth/login` - Login administrativo
- `POST /api/auth/logout` - Logout
- `GET /api/auth/check` - Verificar autenticação

## 📱 Compartilhamento via WhatsApp

Para enviar o link de feedback via WhatsApp:

```url
https://seu-dominio.com/?utm_source=whatsapp&utm_campaign=feedback_paciente
```

Ou com mensagem pré-formatada:
```
Olá! Agradecemos sua visita à Clínica Odontológica Zucato. Gostaria que avaliasse sua experiência:
https://seu-dominio.com/
```

## 🚢 Deploy

### Netlify
```bash
npm run build
```

### Vercel
```bash
vercel deploy
```

### Ambiente Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Estrutura de Pastas

```
zucato-feedback/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   ├── auth/
│   │   └── feedback/
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── obrigado/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── DashboardCards.tsx
│   ├── DashboardCharts.tsx
│   ├── FeedbackForm.tsx
│   ├── FeedbackTable.tsx
│   └── StarRating.tsx
├── lib/
│   ├── auth.ts
│   ├── security.ts
│   ├── sentiment.ts
│   └── supabase.ts
├── database.sql
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🐛 Troubleshooting

### Erro de Autenticação no Supabase
- Verifique as chaves em `.env.local`
- Confirme que as tabelas foram criadas (SQL Editor > Execute database.sql)

### Gráficos não aparecem
- Certifique-se que `chart.js-2` está instalado
- Limpe cache: `npm cache clean --force`

### Rate limit acionado
- O sistema limita a 10 requisições por minuto
- Aguarde 1 minuto antes de nova submissão

## 📚 Recursos Adicionais

- [Documentação Next.js](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TailwindCSS](https://tailwindcss.com/docs)
- [Chart.js](https://www.chartjs.org/docs/)

## 📄 Licença

Todos os direitos reservados © 2026 Clínica Odontológica Zucato

## ✉️ Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.

---

## 🐛 **Troubleshooting - Problemas Comuns**

### **"Erro desconhecido" ao enviar feedback**
**Causa:** Supabase não configurado
**Solução:**
1. Configure `.env.local` com credenciais reais do Supabase
2. Execute `database.sql` no painel do Supabase
3. Teste com `node scripts/test-api.js`

### **Supabase em vermelho no editor**
**Causa:** Dependências não instaladas ou cache do TypeScript
**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### **"Cannot find module '@supabase/supabase-js'"**
**Causa:** Dependências não instaladas
**Solução:**
```bash
npm install
```

### **Erro ao criar admin**
**Causa:** Variáveis de ambiente não configuradas
**Solução:**
```bash
node scripts/check-config.js
# Configure .env.local se necessário
```

### **Gráficos não aparecem**
**Causa:** Chart.js não carregou
**Solução:** Recarregue a página ou execute `npm install`

### **Logo não aparece**
**Causa:** Arquivo não está em `/public/`
**Solução:** Verifique se `Logo.png` está em `/public/Logo.png`

---

## 📚 **Scripts Disponíveis**

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm start            # Inicia servidor de produção
npm run lint         # Verifica código

# Scripts customizados
bash setup.sh                    # Configuração automática
node scripts/check-config.js     # Verifica configuração
node scripts/create-admin.js     # Cria usuário admin
node scripts/test-api.js         # Testa API
bash generate-secret.sh          # Gera secret seguro
```

---

## 📞 **Suporte**

Se ainda tiver problemas:

1. Execute `node scripts/check-config.js` para verificar configuração
2. Teste a API com `node scripts/test-api.js`
3. Verifique os logs do console do navegador (F12)
4. Consulte a documentação em `SETUP.md` e `DEPLOYMENT.md`

---

**Versão:** 1.0.1
**Última atualização:** 7 de março de 2026
**Status:** ✅ Pronto para uso
