import { NextResponse } from 'next/server'

export const maxDuration = 300

interface ClaudeRequest {
  system: string
  user: string
  pdfBase64?: string
  pdfName?: string
}

export async function POST(request: Request) {
  const { system, user, pdfBase64, pdfName }: ClaudeRequest = await request.json()

  if (!system || !user) {
    return NextResponse.json({ error: 'Campos "system" e "user" são obrigatórios.' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada.' }, { status: 500 })
  }

  // Build user message content — include PDF if provided
  const userContent: unknown[] = pdfBase64
    ? [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
          title: pdfName ?? 'material.pdf',
          citations: { enabled: false },
        },
        { type: 'text', text: user },
      ]
    : [{ type: 'text', text: user }]

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system,
        messages: [{ role: 'user', content: userContent }],
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message ?? `HTTP ${res.status}` }, { status: res.status })
    }

    return NextResponse.json({ text: data.content[0].text })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
