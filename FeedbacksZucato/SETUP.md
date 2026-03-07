# Guia de Configuração - Ambiente Local

## 1. Criar Projeto Supabase

1. Acesse https://supabase.com/
2. Crie uma nova organização e projeto
3. Aguarde a inicialização do banco de dados

## 2. Copiar Credenciais

No painel do Supabase:
- Settings > API
- Copie `Project URL` para `NEXT_PUBLIC_SUPABASE_URL`
- Copie `anon public` para `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copie `service_role secret` para `SUPABASE_SERVICE_ROLE_KEY`

## 3. Criar Tabelas

1. No Supabase, vá para SQL Editor
2. Crie uma aba nova
3. Copie todo o conteúdo de `database.sql`
4. Clique em "Execute"

Você deverá ver mensagens de sucesso para cada tabela criada.

## 4. Adicionar Usuário Admin

No SQL Editor do Supabase, execute:

```sql
-- Instale a extensão pgcrypto (se já não estiver)
create extension if not exists pgcrypto;

-- Gere um hash bcrypt (use ferramentas online ou Node.js):
-- No Terminal: node -e "console.log(require('bcryptjs').hashSync('sua-senha', 10))"

INSERT INTO admins (email, password_hash) VALUES (
  'seu@email.com',
  '$2a$10$SuaHashBcryptAqui...'
);
```

## 5. Variáveis de Ambiente

Crie arquivo `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Admin
ADMIN_SECRET=seu-secret-codigo-aleatorio-aqui-64-caracteres

# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Ambiente
NODE_ENV=development
```

## 6. Executar Desenvolvimento

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

## 7. Testar Administrativo

- URL: http://localhost:3000/admin/login
- Email: seu@email.com
- Senha: sua-senha

## Troubleshooting

### Erro "Chave de API inválida"
- Verify que copiou corretamente as credenciais
- Confirme que o projeto está ativo no Supabase

### Erro "Tabelas não encontradas"
- Execute novamente o script `database.sql`
- Verifique se não há erros no SQL

### JWT inválido
- Gere um novo `ADMIN_SECRET` com 64 caracteres aleatórios
- Limpe cookies do navegador

---

**Próximas etapas:**
- [ ] Configurar domínio customizado
- [ ] Configurar HTTPS/SSL
- [ ] Fazer deploy na Vercel/Netlify
- [ ] Configurar backups automáticos
