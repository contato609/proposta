'use client'

import { useState } from 'react'

export default function CopyTextButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        background: copied ? 'rgba(122,158,106,0.12)' : 'var(--surface)',
        border: `1px solid ${copied ? 'var(--editor)' : 'var(--border-soft)'}`,
        borderRadius: 6, padding: '5px 12px', fontSize: 11,
        color: copied ? 'var(--editor)' : 'var(--text-dim)',
        cursor: 'pointer', letterSpacing: 1,
        display: 'flex', alignItems: 'center', gap: 5,
        transition: 'all 0.2s',
      }}
    >
      {copied ? '✓ Copiado!' : '📋 Copiar texto'}
    </button>
  )
}
