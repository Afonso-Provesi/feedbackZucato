# 🔐 Instruções Para Implementar Segurança Aprimorada

## 1. Adicionar Coluna de Device Fingerprint

Acesse o **SQL Editor** do seu projeto Supabase e execute:

```sql
-- Adiciona coluna device_fingerprint para rastreamento de dispositivo
ALTER TABLE feedbacks ADD COLUMN device_fingerprint VARCHAR(64);

-- Índices para buscar feedbacks do mesmo dispositivo rapidamente
CREATE INDEX idx_feedbacks_device_fingerprint ON feedbacks(device_fingerprint);
CREATE INDEX idx_feedbacks_device_date ON feedbacks(device_fingerprint, DATE(created_at));
```

## 2. Recriar o Admin com Email Criptografado

Como o email dos admins agora é criptografado, você precisa **recriar o admin antigo** (se houver).

Opção A: Delete o admin antigo via SQL:
```sql
DELETE FROM admins WHERE id = 'seu-id-aqui';
```

Opção B: Simplesmente crie um novo admin executando:
```bash
node scripts/create-admin.js
```

Você serão pedidos:
- Email do novo admin
- Senha (mín. 8 caracteres)

O email será **automaticamente criptografado** ao salvar.

## 3. Funcionalidades Adicionadas

### ✅ Filtro de Dispositivo (1 avaliação/dispositivo/dia)
- Cada navegador/dispositivo pode enviar **no máximo 1 avaliação por dia**
- Usa fingerprint baseado em User-Agent + IP
- Retorna erro 429 com mensagem amigável se tentar duplicar

### ✅ Criptografia de Email Admin
- Emails dos admins são criptografados em repouso com **AES-256-GCM**
- Chave em `ENCRYPTION_KEY` no `.env.local`
- Login descriptografa automaticamente para autenticação

## 4. Variáveis de Ambiente

Certificar-se que seu `.env.local` contém:
```
ENCRYPTION_KEY=3a4c7f9b2e1d8a5f6c9e2b4d7f1a3c5e8b0d2f4a6c8e1b3d5f7a9c0e2b4d6f
```

**Importante:** Em produção, mude essa chave para um valor aleatório de 64 caracteres hex!

## 5. Reiniciar o Servidor

```bash
npm run dev
```

Pronto! Agora seu sistema tem:
- ✅ Proteção contra spam (máx. 1 feedback/dispositivo/dia)
- ✅ Emails de admins seguros (criptografados)
- ✅ Acesso seguro ao painel admin
