type SentimentType = 'positivo' | 'neutro' | 'negativo' | 'misto'

const positivoKeywords = [
  'ótimo', 'excelente', 'maravilhoso', 'perfeito', 'adorei', 'amei', 'muito bom',
  'recomendo', 'feliz', 'satisfeito', 'gostei', 'incrível', 'fantástico', 'legal',
  'sensacional', 'espetacular', 'formidável', 'bom', 'agradável', 'bacana',
  'demais', 'top', 'show', 'massa', 'maneiro', 'legal demais', 'super bom',
  'muito legal', 'melhor', 'ótima', 'excelentes', 'adoraram', 'amaram',
  'atencioso', 'atenciosa', 'educado', 'educada', 'cuidadoso', 'cuidadosa',
  'acolhedor', 'acolhedora', 'seguro', 'segura', 'gentil', 'gentileza'
]

const negativoKeywords = [
  'ruim', 'péssimo', 'horrível', 'terrível', 'detestei', 'odiei', 'muito ruim',
  'decepcionado', 'decepcionante', 'insatisfeito', 'problema', 'problemas', 'não gostei',
  'desagradável', 'chato', 'chato demais', 'ruim demais', 'fraco', 'fraca', 'pior',
  'decepção', 'demorado', 'lento', 'lenta', 'caro', 'muito caro', 'abusivo',
  'inadequado', 'deficiente', 'falha', 'falhas', 'erro', 'erros', 'atraso',
  'espera', 'esperei', 'descaso', 'grosseiro', 'grosseira', 'frustrado', 'frustrante',
  'desorganizado', 'desorganizada', 'apressado', 'apressada'
]

const contrastKeywords = [
  'mas', 'porém', 'porem', 'entretanto', 'só que', 'so que', 'apesar', 'em compensação',
  'tirando', 'exceto', 'no entanto'
]

const mixedSignalKeywords = [
  'pontos positivos', 'pontos negativos', 'ponto positivo', 'ponto negativo',
  'por um lado', 'por outro lado', 'ao mesmo tempo', 'em partes',
  'coisas boas e ruins', 'gostei de algumas coisas', 'nao gostei de algumas coisas'
]

const mildComplaintKeywords = [
  'mais ou menos', 'razoável', 'razoavel', 'mediano', 'ok', 'regular', 'poderia ser melhor',
  'não foi ruim', 'na média', 'na media'
]

function getRatingBias(rating?: number | null) {
  if (typeof rating !== 'number' || Number.isNaN(rating)) {
    return { positivo: 0, negativo: 0 }
  }

  if (rating >= 9) {
    return { positivo: 3, negativo: 0 }
  }

  if (rating >= 7) {
    return { positivo: 2, negativo: 0 }
  }

  if (rating >= 5) {
    return { positivo: 0, negativo: 0 }
  }

  if (rating >= 3) {
    return { positivo: 0, negativo: 2 }
  }

  return { positivo: 0, negativo: 3 }
}

export function analyzeSentiment(text: string, rating?: number | null): SentimentType {
  const normalizedText = text?.trim() || ''
  const lowerText = normalizedText.toLowerCase()

  let positiveTextScore = 0
  let negativeTextScore = 0

  positivoKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      positiveTextScore++
    }
  })

  negativoKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      negativeTextScore++
    }
  })

  const hasContrast = contrastKeywords.some(keyword => lowerText.includes(keyword))
  const hasMixedSignal = mixedSignalKeywords.some(keyword => lowerText.includes(keyword))
  const hasMildComplaint = mildComplaintKeywords.some(keyword => lowerText.includes(keyword))
  const hasMixedTextSignals = positiveTextScore > 0 && negativeTextScore > 0

  let positivoScore = positiveTextScore
  let negativoScore = negativeTextScore

  const ratingBias = getRatingBias(rating)
  positivoScore += ratingBias.positivo
  negativoScore += ratingBias.negativo

  if (!normalizedText && positivoScore === 0 && negativoScore === 0) {
    return 'neutro'
  }

  if (hasMixedTextSignals && (hasContrast || hasMixedSignal || Math.abs(positiveTextScore - negativeTextScore) <= 1)) {
    return 'misto'
  }

  if ((hasContrast || hasMixedSignal) && positiveTextScore > 0 && negativoScore > 0) {
    return 'misto'
  }

  if (hasMildComplaint && !hasMixedTextSignals) {
    return 'neutro'
  }

  if (positivoScore > 0 && negativoScore > 0) {
    if (hasContrast) {
      return 'misto'
    }

    if (Math.abs(positivoScore - negativoScore) <= 1) {
      return 'misto'
    }

    if (Math.abs(positivoScore - negativoScore) <= 2) {
      return 'neutro'
    }
  }

  if (positivoScore > negativoScore) {
    return 'positivo'
  } else if (negativoScore > positivoScore) {
    return 'negativo'
  } else {
    return 'neutro'
  }
}

export function getSentimentLabel(sentiment: SentimentType): string {
  const labels = {
    positivo: 'Positivo 😊',
    negativo: 'Negativo 😞',
    neutro: 'Mediano 😐',
    misto: 'Misto / Atenção 👀',
  }
  return labels[sentiment]
}

export function getSentimentColor(sentiment: SentimentType): string {
  const colors = {
    positivo: '#22c55e',
    negativo: '#ef4444',
    neutro: '#94a3b8',
    misto: '#f59e0b',
  }
  return colors[sentiment]
}

export type { SentimentType }
