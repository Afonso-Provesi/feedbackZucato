#!/bin/bash

# Script de configuração rápida - Clínica Odontológica Zucato
# Execute: bash setup.sh

echo "🚀 Configuração Rápida - Clínica Odontológica Zucato"
echo "=================================================="
echo ""

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script dentro da pasta do projeto"
    exit 1
fi

echo "📦 Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

echo "✅ Dependências instaladas!"
echo ""

# Verificar se .env.local existe
if [ ! -f ".env.local" ]; then
    echo "📝 Criando arquivo .env.local..."
    cp .env.example .env.local
    echo "✅ Arquivo .env.local criado!"
    echo ""
    echo "⚠️  IMPORTANTE: Edite o arquivo .env.local com suas credenciais do Supabase!"
    echo "   Obtenha as credenciais em: https://supabase.com/dashboard"
    echo ""
fi

echo "🔍 Verificando configuração..."
node scripts/check-config.js

echo ""
echo "🎯 Próximos passos:"
echo "1. Configure o Supabase no arquivo .env.local"
echo "2. Execute o SQL em database.sql no painel do Supabase"
echo "3. Crie um admin: node scripts/create-admin.js"
echo "4. Execute: npm run dev"
echo "5. Acesse: http://localhost:3000"
echo ""
echo "📚 Documentação:"
echo "- README.md: Documentação completa"
echo "- SETUP.md: Guia detalhado de configuração"
echo "- DEPLOYMENT.md: Guia de deploy"
echo ""
echo "💡 Dúvidas? Consulte a documentação ou entre em contato."