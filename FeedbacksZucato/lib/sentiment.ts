type SentimentType = 'positivo' | 'neutro' | 'negativo'

const positivoKeywords = [
  'ótimo', 'excelente', 'maravilhoso', 'perfeito', 'adorei', 'amei', 'muito bom',
  'recomendo', 'feliz', 'satisfeito', 'gostei', 'incrível', 'fantástico', 'legal',
  'sensacional', 'espetacular', 'formidável', 'bom', 'agradável', 'bacana',
  'demais', 'top', 'show', 'massa', 'maneiro', 'legal demais', 'super bom',
  'muito legal', 'melhor', 'ótima', 'excelentes', 'adoraram', 'amaram'
]

const negativoKeywords = [
  'ruim', 'péssimo', 'horrível', 'terrível', 'detestei', 'odiei', 'muito ruim',
  'decepcionado', 'decepcionante', 'insatisfeito', 'problema', 'problemas', 'não gostei',
  'desagradável', 'chato', 'chato demais', 'ruim demais', 'fraco', 'fraca', 'pior',
  'decepção', 'demorado', 'lento', 'lenta', 'caro', 'muito caro', 'abusivo',
  'inadequado', 'deficiente', 'falha', 'falhas', 'erro', 'erros'
]

export function analyzeSentiment(text: string): SentimentType {
  if (!text || text.trim().length === 0) {
    return 'neutro'
  }

  const lowerText = text.toLowerCase()

  let positivoScore = 0
  let negativoScore = 0

  positivoKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      positivoScore++
    }
  })

  negativoKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      negativoScore++
    }
  })

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
    neutro: 'Neutro 😐',
  }
  return labels[sentiment]
}

export function getSentimentColor(sentiment: SentimentType): string {
  const colors = {
    positivo: '#22c55e',
    negativo: '#ef4444',
    neutro: '#94a3b8',
  }
  return colors[sentiment]
}
