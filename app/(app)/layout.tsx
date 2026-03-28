import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top nav */}
      <header style={{
        padding: '20px 40px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0,
        background: 'rgba(10,10,11,0.92)',
        backdropFilter: 'blur(20px)',
        zIndex: 100,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, border: '1.5px solid var(--gold)', borderRadius: 8,
            display: 'grid', placeItems: 'center',
            fontFamily: 'Cormorant Garamond, serif', fontSize: 16, fontWeight: 600, color: 'var(--gold)',
          }}>SVG</div>
          <div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 300, letterSpacing: 2, color: 'var(--text)' }}>
              Copy Agent
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 3, textTransform: 'uppercase' }}>
              Pipeline Imobiliário
            </div>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/copies" style={{
            fontSize: 12, color: 'var(--text-dim)', textDecoration: 'none',
            letterSpacing: 1, padding: '6px 14px',
            border: '1px solid var(--border-soft)', borderRadius: 8,
            background: 'var(--surface)',
          }}>
            Biblioteca de Copys
          </Link>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{user.email}</span>
          <LogoutButton />
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  )
}
