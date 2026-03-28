'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const supabase = createClient()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border-soft)',
        borderRadius: 8, padding: '7px 14px', fontSize: 12,
        color: 'var(--text-dim)', cursor: 'pointer', letterSpacing: 1,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gold)'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--gold)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-soft)'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-dim)'
      }}
    >
      Sair
    </button>
  )
}
