#!/usr/bin/env node

/**
 * Script para testar a API de feedback
 * Uso: node scripts/test-api.js
 */

const fetch = require('node-fetch')

async function testAPI() {
  console.log('🧪 Testando API de Feedback...\n')

  const testData = {
    rating: 5,
    comment: 'Excelente atendimento!',
    isAnonymous: true,
    patientName: null,
    source: 'whatsapp'
  }

  try {
    console.log('📤 Enviando requisição de teste...')
    console.log('Dados:', JSON.stringify(testData, null, 2))

    const response = await fetch('http://localhost:3000/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    })

    console.log(`📥 Status da resposta: ${response.status} ${response.statusText}`)

    const responseText = await response.text()
    console.log('📄 Corpo da resposta:')
    console.log(responseText)

    if (response.ok) {
      console.log('\n✅ API funcionando corretamente!')
    } else {
      console.log('\n❌ API retornou erro')
    }

  } catch (error) {
    console.log('\n❌ Erro de conexão:')
    console.log(error.message)
    console.log('\n💡 Certifique-se de que o servidor está rodando:')
    console.log('   npm run dev')
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  testAPI()
}

module.exports = { testAPI }