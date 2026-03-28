'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-4 mb-12 justify-center">
          <div style={{
            width: 44, height: 44,
            border: '1.5px solid var(--gold)',
            borderRadius: 10,
            display: 'grid', placeItems: 'center',
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 20, fontWeight: 600,
            color: 'var(--gold)',
          }}>SVG</div>
          <div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, letterSpacing: 2 }}>
              Copy Agent
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 3, textTransform: 'uppercase' }}>
              Pipeline Imobiliário
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border-soft)',
          borderRadius: 16, padding: '32px',
        }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, marginBottom: 24 }}>
            Entrar
          </h1>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 6 }}>
                E-MAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: '100%', background: 'var(--surface)',
                  border: '1px solid var(--border-soft)', borderRadius: 8,
                  padding: '10px 12px', fontSize: 14, color: 'var(--text)',
                  outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-soft)'}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 6 }}>
                SENHA
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: '100%', background: 'var(--surface)',
                  border: '1px solid var(--border-soft)', borderRadius: 8,
                  padding: '10px 12px', fontSize: 14, color: 'var(--text)',
                  outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-soft)'}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p style={{ fontSize: 13, color: '#E07070', background: 'rgba(224,112,112,0.08)', borderRadius: 8, padding: '10px 14px' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                background: loading ? 'var(--surface)' : 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
                color: loading ? 'var(--text-dim)' : 'var(--bg)',
                border: 'none', borderRadius: 10,
                padding: '13px 20px', fontSize: 13, fontWeight: 500,
                letterSpacing: 1, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? <><span className="spinner" />Entrando...</> : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>
          Acesso restrito. Solicite ao administrador.
        </p>
      </div>
    </div>
  )
}
