import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('*, copies(count), project_files(count)')
    .order('created_at', { ascending: false })

  const typeLabel = (type: string) => type === 'loteamento' ? 'Loteamento' : 'Vertical'
  const typeColor = (type: string) => type === 'loteamento' ? 'var(--editor)' : 'var(--analyst)'

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
            Painel
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300 }}>
            Empreendimentos
          </h1>
        </div>
        <Link href="/projects/new" style={{
          background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
          color: 'var(--bg)', textDecoration: 'none',
          borderRadius: 10, padding: '12px 24px',
          fontSize: 13, fontWeight: 500, letterSpacing: 1,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          + Novo Empreendimento
        </Link>
      </div>

      {/* Empty state */}
      {(!projects || projects.length === 0) && (
        <div style={{
          textAlign: 'center', padding: '80px 40px',
          border: '1px dashed var(--border)', borderRadius: 16,
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.3 }}>⬡</div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color: 'var(--text-dim)', marginBottom: 12 }}>
            Nenhum empreendimento ainda
          </h2>
          <p style={{ fontSize: 14, marginBottom: 32, maxWidth: 340, margin: '0 auto 32px' }}>
            Cadastre o primeiro produto imobiliário para iniciar o pipeline de geração de copy.
          </p>
          <Link href="/projects/new" style={{
            background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
            color: 'var(--bg)', textDecoration: 'none',
            borderRadius: 10, padding: '12px 28px',
            fontSize: 13, fontWeight: 500, letterSpacing: 1,
          }}>
            + Novo Empreendimento
          </Link>
        </div>
      )}

      {/* Grid */}
      {projects && projects.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
        }}>
          {projects.map((p: Record<string, unknown>, i: number) => {
            const copyCount = (p.copies as { count: number }[])?.[0]?.count ?? 0
            const fileCount = (p.project_files as { count: number }[])?.[0]?.count ?? 0
            return (
              <Link key={p.id as string} href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                <div
                  className="animate-fade-in"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    background: 'var(--bg2)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 14, padding: '24px',
                    transition: 'border-color 0.2s, transform 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
                    ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-soft)'
                    ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                  }}
                >
                  {/* Type badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{
                      fontSize: 10, letterSpacing: 2, padding: '3px 10px', borderRadius: 20,
                      background: `rgba(${p.type === 'loteamento' ? '122,158,106' : '74,158,191'},0.12)`,
                      color: typeColor(p.type as string), fontWeight: 500,
                    }}>
                      {typeLabel(p.type as string).toUpperCase()}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(p.created_at as string).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <h2 style={{ fontSize: 18, fontFamily: 'Cormorant Garamond, serif', fontWeight: 400, marginBottom: 8 }}>
                    {p.name as string}
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 20 }}>
                    📍 {p.location as string}
                  </p>

                  {/* Stats */}
                  <div style={{
                    display: 'flex', gap: 16, paddingTop: 16,
                    borderTop: '1px solid var(--border-soft)',
                  }}>
                    <div>
                      <div style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', color: 'var(--gold)' }}>
                        {copyCount}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>COPYS</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dim)' }}>
                        {fileCount}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>PDFs</div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
