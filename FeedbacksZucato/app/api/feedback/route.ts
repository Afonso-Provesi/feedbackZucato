import { NextRequest, NextResponse } from 'next/server'
import { saveFeedback, supabaseAdmin } from '@/lib/supabase'
import { analyzeSentiment } from '@/lib/sentiment'
import { sanitizeInput, validateRating, checkRateLimit } from '@/lib/security'
import { generateDeviceFingerprint } from '@/lib/crypto'
import { isValidDentistName } from '@/lib/dentists'

export async function POST(req: NextRequest) {
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL)
    const supabaseKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    if (!supabaseUrl || supabaseUrl === 'your_supabase_url' || supabaseUrl.includes('teste.supabase.co')) {
      return NextResponse.json(
        {
          error: 'Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local',
          details: 'Obtenha as credenciais em https://supabase.com/dashboard > Settings > API'
        },
        { status: 500 }
      )
    }

    if (!supabaseKey || supabaseKey === 'your_supabase_anon_key' || supabaseKey.includes('test')) {
      return NextResponse.json(
        {
          error: 'Chave do Supabase não configurada. Configure NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local',
          details: 'Obtenha a chave anônima em https://supabase.com/dashboard > Settings > API'
        },
        { status: 500 }
      )
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    if (!checkRateLimit(ip, 10, 60000)) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente mais tarde.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { rating, comment, isAnonymous, patientName, source, dentistName, dentistRating, dentistComment } = body

    // Validação
    if (!validateRating(rating)) {
      return NextResponse.json(
        { error: 'Avaliação inválida. Deve ser um número de 1 a 10.' },
        { status: 400 }
      )
    }

    if (!dentistName || !isValidDentistName(dentistName)) {
      return NextResponse.json(
        { error: 'Selecione um dentista válido.' },
        { status: 400 }
      )
    }

    if (!validateRating(dentistRating)) {
      return NextResponse.json(
        { error: 'A avaliação do dentista deve ser um número de 1 a 10.' },
        { status: 400 }
      )
    }

    // Gerar fingerprint do dispositivo
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const deviceFingerprint = generateDeviceFingerprint(userAgent, ip)

    // Verificar se já existe feedback do mesmo dispositivo no mesmo dia
    const today = new Date().toISOString().split('T')[0]
    const { data: duplicates } = await supabaseAdmin
      .from('feedbacks')
      .select('id')
      .eq('device_fingerprint', deviceFingerprint)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    if (duplicates && duplicates.length > 0) {
      return NextResponse.json(
        {
          error: 'Você já enviou uma avaliação hoje.',
          details: 'Cada dispositivo pode enviar no máximo uma avaliação por dia.'
        },
        { status: 429 }
      )
    }

    // Sanitizar inputs
    const sanitizedComment = comment ? sanitizeInput(comment) : null
    const sanitizedName = patientName ? sanitizeInput(patientName) : null
    const sanitizedDentistComment = dentistComment ? sanitizeInput(dentistComment) : null

    // Analisar sentimento considerando texto e nota atribuída
    const sentiment = analyzeSentiment(sanitizedComment || '', parseInt(rating))
    const dentistSentiment = analyzeSentiment(sanitizedDentistComment || '', parseInt(dentistRating))

    // Salvar no banco
    await saveFeedback({
      rating: parseInt(rating),
      comment: sanitizedComment,
      dentist_name: dentistName,
      dentist_rating: parseInt(dentistRating),
      dentist_comment: sanitizedDentistComment,
      dentist_sentiment: dentistSentiment,
      sentiment,
      is_anonymous: isAnonymous,
      patient_name: isAnonymous ? null : sanitizedName,
      source: source || 'whatsapp',
      device_fingerprint: deviceFingerprint,
    })

    return NextResponse.json(
      { success: true },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao salvar feedback:', error)

    // Dar mais detalhes sobre o erro
    let errorMessage = 'Erro interno do servidor'
    let errorDetails = 'Verifique os logs do servidor'

    if (error instanceof Error) {
      if (error.message.includes('JWT')) {
        errorMessage = 'Erro de autenticação com Supabase'
        errorDetails = 'Verifique se as chaves do Supabase estão corretas'
      } else if (error.message.includes('connect')) {
        errorMessage = 'Erro de conexão com Supabase'
        errorDetails = 'Verifique se a URL do Supabase está correta'
      } else if (error.message.includes('relation') || error.message.includes('table')) {
        errorMessage = 'Tabela não encontrada no Supabase'
        errorDetails = 'Execute o SQL em database.sql no painel do Supabase'
      } else if (error.message.includes('column') || error.message.includes('schema cache')) {
        errorMessage = 'Estrutura do Supabase desatualizada'
        errorDetails = 'Execute o SQL de scripts/migration-dentist-feedback.sql no painel do Supabase para criar as colunas de avaliação do dentista.'
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
