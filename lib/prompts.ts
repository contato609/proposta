import type { Project } from './types'

export function buildAnalystPrompts(project: Project, hasPdf: boolean) {
  const typeLabel = project.type === 'loteamento'
    ? 'Loteamento Residencial/Comercial'
    : 'Lançamento Vertical (Apartamentos)'

  const system = `Você é um Analista de Mercado Imobiliário sênior especializado em ${typeLabel} no Brasil.
Sua missão é levantar informações de mercado relevantes para embasar a criação de textos persuasivos de vendas.
Seja objetivo, preciso e traga dados de comportamento do consumidor, tendências e argumentos de valor.${hasPdf ? '\nO memorial descritivo/material do produto foi anexado — use essas informações para tornar a análise mais específica e precisa.' : ''}
Formate a resposta em seções claras.`

  const user = `Analise o mercado para subsidiar a criação de copys de vendas do empreendimento:

EMPREENDIMENTO: ${project.name}
TIPO: ${typeLabel}
LOCALIZAÇÃO: ${project.location}
PÚBLICO-ALVO: ${project.target_audience || 'Não especificado'}
DIFERENCIAIS: ${project.differentials || 'Não especificados'}
FAIXA DE PREÇO: ${project.price_range || 'Não informado'}
CANAL: ${project.channel}

Estruture com:
1. Perfil psicológico e motivações de compra do público-alvo
2. Gatilhos emocionais e racionais mais eficazes
3. Principais objeções e como neutralizá-las
4. Tendências e argumentos de valorização do mercado hoje no Brasil
5. Vocabulário e tom de voz recomendados
6. Como as grandes incorporadoras comunicam produtos similares
7. 5 ângulos de copy (hook/gancho) com maior potencial de conversão`

  return { system, user }
}

export function buildCopywriterPrompts(project: Project, analystOutput: string) {
  const typeLabel = project.type === 'loteamento' ? 'loteamentos' : 'lançamentos verticais'

  const system = `Você é um Copywriter imobiliário de alto nível especializado em ${typeLabel}.
Domina AIDA, PAS, storytelling, prova social, escassez, urgência e ancoragem de valor.
Conhece as estratégias das maiores incorporadoras do Brasil (Cyrela, MRV, Alphaville, Direcional, Cury, Tenda).
Crie narrativas que constroem imaginário, despertam desejo e impulsionam a ação.
Escreva EXCLUSIVAMENTE os textos numerados, sem explicações ou comentários.`

  const user = `Com base na análise de mercado abaixo, crie EXATAMENTE 10 textos de copy para o empreendimento "${project.name}" no canal ${project.channel}.

ANÁLISE DE MERCADO:
${analystOutput}

PRODUTO:
- Nome: ${project.name}
- Tipo: ${project.type === 'loteamento' ? 'Loteamento' : 'Apartamentos / Lançamento Vertical'}
- Localização: ${project.location}
- Público: ${project.target_audience || 'Não especificado'}
- Diferenciais: ${project.differentials || 'Não especificados'}
- Preço: ${project.price_range || 'Não informado'}

INSTRUÇÕES:
- Cada texto usa um ângulo DIFERENTE (emocional, racional, urgência, sonho, família, investimento, conquista, estilo de vida, comunidade, exclusividade)
- Mínimo 4 parágrafos por texto, CTA claro ao final
- Tom intrigante, aspiracional, específico — sem jargões genéricos
- Adapte ao canal: ${project.channel}
- Separe cada copy com o marcador: ===COPY_N=== (onde N é o número de 1 a 10)`

  return { system, user }
}

export function buildEditorPrompts(project: Project, copywriterOutput: string) {
  const system = `Você é um Redator especializado em revisão de textos publicitários imobiliários.
Revise e polindo os textos mantendo 100% da essência persuasiva e sentido original.
Corrija gramática, pontuação e concordância. Elimine repetições. Melhore a fluidez.
Mantenha os marcadores ===COPY_N=== intactos. Retorne APENAS os textos revisados.`

  const user = `Revise os 10 textos de copy abaixo para "${project.name}".
Preserve o poder persuasivo, ganchos e CTAs. Apenas melhore gramática e fluidez.

${copywriterOutput}`

  return { system, user }
}
