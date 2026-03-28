'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CHANNELS = [
  'redes sociais (Facebook/Instagram)',
  'Google Ads',
  'WhatsApp / Disparos',
  'TV / Rádio',
  'todos os canais',
]

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--surface)',
  border: '1px solid var(--border-soft)', borderRadius: 8,
  padding: '10px 12px', fontSize: 13, color: 'var(--text)',
  outline: 'none', fontFamily: 'DM Sans, sans-serif',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: 'var(--text-dim)',
  marginBottom: 5, letterSpacing: 1,
}

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [form, setForm] = useState({
    name: '', type: 'loteamento', location: '',
    target_audience: '', differentials: '', price_range: '',
    channel: 'redes sociais (Facebook/Instagram)',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).filter(f => f.type === 'application/pdf')
    setFiles(prev => [...prev, ...selected].slice(0, 5))
  }

  function removeFile(i: number) {
    setFiles(f => f.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.location) return setError('Nome e localização são obrigatórios.')
    setLoading(true)
    setError('')

    try {
      // 1. Create project
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao criar projeto.')

      const projectId = data.project.id

      // 2. Upload PDFs
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        const ur = await fetch(`/api/projects/${projectId}/files`, { method: 'POST', body: fd })
        if (!ur.ok) {
          const ue = await ur.json()
          console.error('Upload error:', ue.error)
        }
      }

      router.push(`/projects/${projectId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px' }}>
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 11, letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
          Novo
        </p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 300 }}>
          Cadastrar Empreendimento
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Dados do produto */}
          <section style={{
            background: 'var(--bg2)', border: '1px solid var(--border-soft)',
            borderRadius: 14, padding: '28px',
          }}>
            <p style={{ fontSize: 10, letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 20 }}>
              Dados do Produto
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>NOME DO EMPREENDIMENTO *</label>
                  <input style={inputStyle} value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Ex: Reserva das Flores" required />
                </div>
                <div>
                  <label style={labelStyle}>TIPO *</label>
                  <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
                    <option value="loteamento">Loteamento</option>
                    <option value="vertical">Lançamento Vertical</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>LOCALIZAÇÃO *</label>
                  <input style={inputStyle} value={form.location}
                    onChange={e => set('location', e.target.value)}
                    placeholder="Ex: Campinas - SP, Zona Norte" required />
                </div>
                <div>
                  <label style={labelStyle}>FAIXA DE PREÇO</label>
                  <input style={inputStyle} value={form.price_range}
                    onChange={e => set('price_range', e.target.value)}
                    placeholder="Ex: A partir de R$ 280.000" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>PÚBLICO-ALVO</label>
                <input style={inputStyle} value={form.target_audience}
                  onChange={e => set('target_audience', e.target.value)}
                  placeholder="Ex: Família classe média, 30-50 anos" />
              </div>
              <div>
                <label style={labelStyle}>DIFERENCIAIS (um por linha)</label>
                <textarea style={{ ...inputStyle, resize: 'none' }} rows={4}
                  value={form.differentials}
                  onChange={e => set('differentials', e.target.value)}
                  placeholder={'Área de lazer completa\nLocalização privilegiada\nFinanciamento facilitado'} />
              </div>
              <div>
                <label style={labelStyle}>CANAL DO ANÚNCIO</label>
                <select style={inputStyle} value={form.channel} onChange={e => set('channel', e.target.value)}>
                  {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* PDF Upload */}
          <section style={{
            background: 'var(--bg2)', border: '1px solid var(--border-soft)',
            borderRadius: 14, padding: '28px',
          }}>
            <p style={{ fontSize: 10, letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
              Material do Produto
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 20 }}>
              Suba o memorial descritivo, book de apresentação ou qualquer PDF com informações do produto. O pipeline irá usá-los como contexto.
            </p>

            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: '1px dashed var(--border)', borderRadius: 10, padding: '32px',
              cursor: 'pointer', gap: 10, transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <span style={{ fontSize: 28 }}>📄</span>
              <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>Clique para selecionar PDFs</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Até 5 arquivos · PDF</span>
              <input type="file" accept=".pdf" multiple hidden onChange={handleFileChange} />
            </label>

            {files.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {files.map((file, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--surface)', borderRadius: 8, padding: '10px 14px',
                    border: '1px solid var(--border-soft)',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>📄 {file.name}</span>
                    <button type="button" onClick={() => removeFile(i)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        cursor: 'pointer', fontSize: 16, lineHeight: 1,
                      }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {error && (
            <p style={{ fontSize: 13, color: '#E07070', background: 'rgba(224,112,112,0.08)', borderRadius: 8, padding: '12px 16px' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => router.back()} style={{
              background: 'var(--surface)', border: '1px solid var(--border-soft)',
              borderRadius: 10, padding: '12px 24px', fontSize: 13, color: 'var(--text-dim)',
              cursor: 'pointer',
            }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{
              background: loading ? 'var(--surface)' : 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
              color: loading ? 'var(--text-dim)' : 'var(--bg)',
              border: 'none', borderRadius: 10, padding: '12px 32px',
              fontSize: 13, fontWeight: 500, letterSpacing: 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {loading ? <><span className="spinner" />Salvando...</> : 'Criar Empreendimento →'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
