import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import CopyTextButton from '@/components/CopyTextButton'

export const dynamic = 'force-dynamic'

export default async function CopiesPage() {
  const supabase = await createClient()

  // Busca todos os projetos com suas copys
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id, name, type, location, channel,
      copies (id, copy_number, text, created_at)
    `)
    .order('created_at', { ascending: false })

  const totalCopies = projects?.reduce((acc, p) => acc + (p.copies?.length ?? 0), 0) ?? 0
  const typeColor = (type: string) => type === 'loteamento' ? 'var(--editor)' : 'var(--analyst)'
  const typeLabel = (type: string) => type === 'loteamento' ? 'Loteamento' : 'Vertical'

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
            Biblioteca
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300 }}>
            Copys Geradas
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{
            fontSize: 13, color: 'var(--text-dim)',
            background: 'var(--surface)', padding: '6px 16px',
            borderRadius: 20, border: '1px solid var(--border-soft)',
          }}>
            {totalCopies} textos · {projects?.length ?? 0} empreendimentos
          </span>
          <Link href="/" style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '10px 20px',
            fontSize: 12, color: 'var(--gold)', textDecoration: 'none',
            letterSpacing: 1,
          }}>← Painel</Link>
        </div>
      </div>

      {/* Empty state */}
      {(!projects || totalCopies === 0) && (
        <div style={{
          textAlign: 'center', padding: '80px 40px',
          border: '1px dashed var(--border)', borderRadius: 16,
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.3 }}>📋</div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color: 'var(--text-dim)', marginBottom: 12 }}>
            Nenhuma copy gerada ainda
          </h2>
          <p style={{ fontSize: 14, marginBottom: 32 }}>
            Acesse um empreendimento e clique em <strong>Gerar 10 Copys</strong> para começar.
          </p>
          <Link href="/" style={{
            background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
            color: 'var(--bg)', textDecoration: 'none',
            borderRadius: 10, padding: '12px 28px', fontSize: 13, fontWeight: 500,
          }}>Ir para o Painel</Link>
        </div>
      )}

      {/* Projects with copies */}
      {projects?.filter(p => p.copies && p.copies.length > 0).map(project => (
        <div key={project.id} style={{ marginBottom: 56 }}>
          {/* Project header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 20, paddingBottom: 16,
            borderBottom: '1px solid var(--border-soft)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{
                fontSize: 10, letterSpacing: 2, padding: '3px 10px', borderRadius: 20,
                background: `rgba(${project.type === 'loteamento' ? '122,158,106' : '74,158,191'},0.12)`,
                color: typeColor(project.type), fontWeight: 500,
              }}>{typeLabel(project.type).toUpperCase()}</span>
              <div>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400 }}>
                  {project.name}
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                  📍 {project.location} · {project.channel}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{
                fontSize: 11, color: 'var(--gold)',
                background: 'rgba(201,168,76,0.08)', padding: '4px 12px',
                borderRadius: 20, border: '1px solid var(--border)',
              }}>
                {project.copies?.length} copys
              </span>
              <Link href={`/projects/${project.id}`} style={{
                background: 'var(--surface)', border: '1px solid var(--border-soft)',
                borderRadius: 8, padding: '6px 14px',
                fontSize: 11, color: 'var(--text-dim)', textDecoration: 'none',
                letterSpacing: 1,
              }}>Abrir projeto →</Link>
            </div>
          </div>

          {/* Copies grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 14,
          }}>
            {project.copies?.sort((a, b) => a.copy_number - b.copy_number).map((copy) => (
              <CopyCard key={copy.id} copy={copy} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CopyCard({ copy }: { copy: { id: string; copy_number: number; text: string; created_at: string } }) {
  const preview = copy.text.slice(0, 220).trim()
  const isTruncated = copy.text.length > 220

  return (
    <div className="animate-fade-in" style={{
      background: 'var(--bg2)', border: '1px solid var(--border-soft)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px 10px', borderBottom: '1px solid var(--border-soft)',
      }}>
        <span style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 2, fontWeight: 500 }}>
          COPY {String(copy.copy_number).padStart(2, '0')}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {new Date(copy.created_at).toLocaleDateString('pt-BR')}
        </span>
      </div>
      <div style={{ padding: '14px 16px', fontSize: 13, lineHeight: 1.75, color: 'var(--text-dim)' }}>
        {preview}{isTruncated ? '…' : ''}
      </div>
      <CopyFooter text={copy.text} />
    </div>
  )
}

function CopyFooter({ text }: { text: string }) {
  return (
    <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-soft)' }}>
      <CopyTextButton text={text} />
    </div>
  )
}
