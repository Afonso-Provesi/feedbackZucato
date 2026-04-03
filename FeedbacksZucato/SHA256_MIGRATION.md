# 🔐 Atualização de Segurança - SHA-256

## O que mudou

### ❌ Antes (AES-256-GCM)
- Emails criptografados de forma reversível
- Requer armazenamento de IV e Auth Tag
- Maior complexidade

### ✅ Depois (SHA-256)
- Emails hasheados com SHA-256 (irreversível)
- Mais seguro para armazenamento
- Comparação simples: `hash(entrada) === hash(armazenado)`

---

## Arquivos Criados/Atualizados

### 1. `lib/crypto.ts` (Atualizado)
Agora usa apenas SHA-256:
```typescript
export function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex')
}
```

### 2. `scripts/create-admin.js` (Recriado)
- Faz hash do email com SHA-256
- Mantém bcrypt para senha (melhor prática)
- Comando: `node scripts/create-admin.js`

### 3. `app/api/auth/login/route.ts` (Precisa Atualizar)

Atualize a lógica de login para:

```typescript
import { hashEmail } from '@/lib/crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const sanitizedEmail = sanitizeInput(email)
    const emailHash = hashEmail(sanitizedEmail)

    // Buscar admin por email hash
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, password_hash, is_active')
      .eq('email', emailHash)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }

    // Verificar se admin está ativo
    if (!data.is_active) {
      return NextResponse.json(
        { error: 'Admin desativado' },
        { status: 401 }
      )
    }

    // Verificar senha
    const isPasswordValid = await verifyPassword(password, data.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }

    // Criar token com email original (não hash)
    const token = await createToken({
      id: data.id,
      email: sanitizedEmail,
    })

    // Setar cookie
    await setAuthCookie(token)

    return NextResponse.json(
      { success: true, message: 'Login realizado com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
```

---

## ⚡ Passos para Aplicar as Mudanças

### 1. Atualize o arquivo de login
- Abra `app/api/auth/login/route.ts`
- Substitua a lógica acima
- Remova imports de `decryptEmail`
- Adicione import de `hashEmail`

### 2. Remova a ENCRYPTION_KEY do .env.local

```bash
# Antes
ENCRYPTION_KEY=3a4c7f9b2e1d8a5f...

# Depois (remova essa linha)
```

### 3. Recrie os admins

```bash
# Delete admins antigos (opcionalmente no Supabase SQL)
DELETE FROM admins;

# Crie novo admin com SHA-256
node scripts/create-admin.js
```

### 4. Teste o login

```bash
npm run dev
# Acesse http://localhost:3000/autumn/login
# Use as credenciais criadas
```

---

## 🔒 Comparação de Segurança

| Aspecto | AES-256-GCM | SHA-256 |
|---------|-------------|---------|
| Tipo | Criptografia (reversível) | Hash (irreversível) |
| Risco se vazar | Email pode ser descriptografado | Email mesmo hashado é protegido |
| Complexidade | Alta | Baixa |
| Performance | Média | Excelente |
| Ideal para Auth | ❌ | ✅ |

---

## 📋 Checklist

- [ ] Atualizar `app/api/auth/login/route.ts`
- [ ] Remover `ENCRYPTION_KEY` do `.env.local`
- [ ] Executar `node scripts/create-admin.js`
- [ ] Testar login em `/autumn/login`
- [ ] Testar dashboard em `/autumn/audit`
- [ ] Fazer push no GitHub
- [ ] Redeploy na Vercel

---

## ❓ FAQ

**P: Posso recuperar emails antigos?**
R: Não, SHA-256 é irreversível. Mas isso é segurança, não um bug!

**P: E as senhas?**
R: Continuam com bcrypt (que é a melhor prática). SHA-256 é só para emails.

**P: Posso voltar para AES?**
R: Sim, mas não recomendado. SHA-256 é mais seguro.

---

Seu sistema agora está **ainda mais seguro!** 🚀
