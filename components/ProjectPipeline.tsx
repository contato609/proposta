'use client'

import { useState, useRef } from 'react'
import type { Project, ProjectFile, Copy } from '@/lib/types'
import { buildAnalystPrompts, buildCopywriterPrompts, buildEditorPrompts } from '@/lib/prompts'
import Link from 'next/link'

interface Props {
  project: Project
  files: ProjectFile[]
  initialCopies: Copy[]
}

type AgentState = 'idle' | 'running' | 'done' | 'error'

interface StepLog {
  agent: string
  color: string
  text: string
}

interface CopyEntry {
  text: string
  audioUrl?: string
  narrating?: boolean
}

const COLORS = {
  analyst:    'var(--analyst)',
  copywriter: 'var(--copywriter)',
  editor:     'var(--editor)',
  narrator:   'var(--narrator)',
}

function AgentCard({ id, icon, name, role, color, state }: {
  id: string; icon: string; name: string; role: string; color: string; state: AgentState
}) {
  const badgeText = state === 'running' ? (id === 'N' ? 'NARRANDO' : 'RODANDO') : state === 'done' ? 'CONCLUÍDO' : 'AGUARD.'
  const badgeBg = state === 'running' ? color : state === 'done' ? 'rgba(122,158,106,0.2)' : 'rgba(255,255,255,0.04)'
  const badgeColor = state === 'running' ? 'var(--bg)' : state === 'done' ? 'var(--editor)' : 'var(--text-muted)'
  return (
    <div style={{
      background: state === 'running' ? 'var(--bg3)' : 'var(--surface)',
      border: `1px solid ${state === 'running' ? color : 'var(--border-soft)'}`,
      borderRadius: 10, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      position: 'relative', overflow: 'hidden',
      transition: 'all 0.3s',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        borderRadius: '3px 0 0 3px',
        background: color, opacity: state === 'running' ? 1 : 0.3,
      }} />
      <div style={{
        width: 36, height: 36, borderRadius: 8, display: 'grid', placeItems: 'center',
        fontSize: 16, background: 'rgba(255,255,255,0.04)', flexShrink: 0,
        border: '1px solid var(--border-soft)',
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{role}</div>
      </div>
      <div style={{
        fontSize: 10, letterSpacing: 1, padding: '3px 8px', borderRadius: 20,
        fontWeight: 500, background: badgeBg, color: badgeColor,
        animation: state === 'running' ? 'pulse 1.5s infinite' : 'none',
      }}>{badgeText}</div>
    </div>
  )
}

function StepBlock({ step, collapsed, onToggle }: { step: StepLog; collapsed: boolean; onToggle: () => void }) {
  return (
    <div className="animate-fade-in" style={{
      background: 'var(--bg2)', border: '1px solid var(--border-soft)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
        borderBottom: collapsed ? 'none' : '1px solid var(--border-soft)',
        cursor: 'pointer', userSelect: 'none',
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
          background: step.color, boxShadow: `0 0 6px ${step.color}`,
        }} />
        <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: step.color, letterSpacing: 1.5, textTransform: 'uppercase' }}>
          {step.agent}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }}>
          ▾
        </div>
      </div>
      {!collapsed && (
        <div style={{ padding: 20 }}>
          <pre style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-dim)', whiteSpace: 'pre-wrap', fontFamily: 'DM Sans, sans-serif' }}>
            {step.text}
          </pre>
        </div>
      )}
    </div>
  )
}

export default function ProjectPipeline({ project, files, initialCopies }: Props) {
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>({ A: 'idle', C: 'idle', E: 'idle', N: 'idle' })
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<StepLog[]>([])
  const [copies, setCopies] = useState<CopyEntry[]>(() => initialCopies.map(c => ({ text: c.text })))
  const [isRunning, setIsRunning] = useState(false)
  const [collapsedSteps, setCollapsedSteps] = useState<Set<number>>(new Set())
  const [toast, setToast] = useState('')
  const [voiceId, setVoiceId] = useState('21m00Tcm4TlvDq8ikWAM')
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(files)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string, dur = 3000) {
    setToast(msg)
    setTimeout(() => setToast(''), dur)
  }

  function setAgent(id: string, state: AgentState) {
    setAgentStates(s => ({ ...s, [id]: state }))
  }

  function addLog(agent: string, color: string, text: string) {
    setLogs(l => [...l, { agent, color, text }])
  }

  function toggleStep(i: number) {
    setCollapsedSteps(s => {
      const n = new Set(s)
      n.has(i) ? n.delete(i) : n.add(i)
      return n
    })
  }

  async function callClaude(system: string, user: string, pdfBase64?: string, pdfName?: string) {
    const res = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, user, pdfBase64, pdfName }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
    return data.text as string
  }

  async function startPipeline() {
    if (isRunning) return
    setIsRunning(true)
    setLogs([])
    setCopies([])
    setProgress(0)
    setCollapsedSteps(new Set())
    Object.keys(agentStates).forEach(id => setAgent(id, 'idle'))

    try {
      // Fetch PDF if available
      let pdfBase64: string | undefined
      let pdfName: string | undefined
      if (projectFiles.length > 0) {
        const pdfRes = await fetch(`/api/projects/${project.id}/pdf`)
        if (pdfRes.ok) {
          const pdfData = await pdfRes.json()
          pdfBase64 = pdfData.base64
          pdfName = pdfData.fileName
        }
      }

      // ── Agent 1: Analyst ──
      setAgent('A', 'running'); setProgress(5)
      const { system: sysA, user: userA } = buildAnalystPrompts(project, !!pdfBase64)
      const analystOutput = await callClaude(sysA, userA, pdfBase64, pdfName)
      addLog('Analista de Mercado', COLORS.analyst, analystOutput)
      setAgent('A', 'done'); setProgress(25)

      // ── Agent 2: Copywriter ──
      setAgent('C', 'running'); setProgress(28)
      const { system: sysC, user: userC } = buildCopywriterPrompts(project, analystOutput)
      const copywriterOutput = await callClaude(sysC, userC)
      addLog('Copywriter', COLORS.copywriter, copywriterOutput)
      setAgent('C', 'done'); setProgress(60)

      // ── Agent 3: Editor ──
      setAgent('E', 'running'); setProgress(63)
      const { system: sysE, user: userE } = buildEditorPrompts(project, copywriterOutput)
      const editorOutput = await callClaude(sysE, userE)
      addLog('Redator', COLORS.editor, editorOutput)
      setAgent('E', 'done'); setProgress(82)

      // Parse copies
      const rawCopies = editorOutput.split(/===COPY_\d+===/).map((s: string) => s.trim()).filter(Boolean).slice(0, 10)
      setCopies(rawCopies.map((text: string) => ({ text })))

      // Save to DB
      await fetch('/api/pipeline/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, analystOutput, copywriterOutput, editorOutput, copies: rawCopies }),
      })

      setProgress(100)
      setAgent('N', 'done')
      showToast(`✓ ${rawCopies.length} copys geradas!`, 4000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      showToast(`✗ ${msg}`, 5000)
      setAgent('A', 'idle'); setAgent('C', 'idle'); setAgent('E', 'idle')
    } finally {
      setIsRunning(false)
    }
  }

  async function narrateSingle(idx: number) {
    if (!voiceId) return showToast('⚠ Informe o Voice ID do ElevenLabs')
    if (!copies[idx]?.text) return
    setCopies(c => c.map((e, i) => i === idx ? { ...e, narrating: true } : e))
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: copies[idx].text, voiceId }),
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error ?? 'Erro ElevenLabs')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setCopies(c => c.map((e, i) => i === idx ? { ...e, audioUrl: url, narrating: false } : e))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro'
      showToast(`✗ ${msg}`, 4000)
      setCopies(c => c.map((e, i) => i === idx ? { ...e, narrating: false } : e))
    }
  }

  async function uploadFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).filter(f => f.type === 'application/pdf')
    if (!selected.length) return
    setUploadingFiles(true)
    for (const file of selected) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/projects/${project.id}/files`, { method: 'POST', body: fd })
      if (res.ok) {
        const { file: newFile } = await res.json()
        setProjectFiles(f => [...f, newFile])
      }
    }
    setUploadingFiles(false)
    e.target.value = ''
    showToast('✓ Arquivos enviados')
  }

  async function deleteFile(fileId: string) {
    await fetch(`/api/projects/${project.id}/files?fileId=${fileId}`, { method: 'DELETE' })
    setProjectFiles(f => f.filter(x => x.id !== fileId))
    showToast('Arquivo removido')
  }

  function copyCopyText(text: string) {
    navigator.clipboard.writeText(text).then(() => showToast('✓ Texto copiado!'))
  }

  function exportTxt() {
    const content = copies.map((c, i) => `COPY ${String(i + 1).padStart(2, '0')}\n${'─'.repeat(60)}\n${c.text}\n`).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }))
    a.download = `copys_${project.name.replace(/\s+/g, '_')}.txt`
    a.click()
    showToast('✓ Download iniciado')
  }

  function exportJson() {
    const data = {
      empreendimento: project.name, tipo: project.type,
      canal: project.channel, geradoEm: new Date().toISOString(),
      copies: copies.map((c, i) => ({ id: i + 1, text: c.text })),
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    a.download = `copys_${project.name.replace(/\s+/g, '_')}.json`
    a.click()
    showToast('✓ Download iniciado')
  }

  const typeLabel = project.type === 'loteamento' ? 'Loteamento' : 'Vertical'
  const typeColor = project.type === 'loteamento' ? 'var(--editor)' : 'var(--analyst)'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 'calc(100vh - 77px)' }}>
      {/* ── SIDEBAR ── */}
      <aside style={{
        borderRight: '1px solid var(--border-soft)',
        padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 24,
        overflowY: 'auto',
      }}>
        {/* Project info */}
        <div>
          <Link href="/" style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', letterSpacing: 1 }}>
            ← Voltar
          </Link>
          <div style={{ marginTop: 16 }}>
            <span style={{
              fontSize: 10, letterSpacing: 2, padding: '3px 10px', borderRadius: 20,
              background: `rgba(${project.type === 'loteamento' ? '122,158,106' : '74,158,191'},0.12)`,
              color: typeColor, fontWeight: 500,
            }}>{typeLabel.toUpperCase()}</span>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 400, marginTop: 10 }}>
              {project.name}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>📍 {project.location}</p>
          </div>
          {(project.target_audience || project.price_range) && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {project.target_audience && (
                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>👥 {project.target_audience}</p>
              )}
              {project.price_range && (
                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>💰 {project.price_range}</p>
              )}
            </div>
          )}
        </div>

        {/* PDFs */}
        <div>
          <p style={{ fontSize: 10, letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 12 }}>
            Materiais PDF
          </p>
          {projectFiles.map(f => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--surface)', borderRadius: 8, padding: '9px 12px',
              border: '1px solid var(--border-soft)', marginBottom: 6,
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📄 {f.file_name}
              </span>
              <button onClick={() => deleteFile(f.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>
                ×
              </button>
            </div>
          ))}
          <button onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFiles}
            style={{
              width: '100%', marginTop: 6, background: 'var(--surface)',
              border: '1px dashed var(--border)', borderRadius: 8, padding: '9px',
              fontSize: 12, color: 'var(--text-dim)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            {uploadingFiles ? <><span className="spinner" />Enviando...</> : '+ Adicionar PDF'}
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf" multiple hidden onChange={uploadFiles} />
        </div>

        {/* Voice ID */}
        <div>
          <p style={{ fontSize: 10, letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
            Narrador (ElevenLabs)
          </p>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 5, letterSpacing: 1 }}>
            VOICE ID
          </label>
          <input value={voiceId} onChange={e => setVoiceId(e.target.value)}
            placeholder="21m00Tcm4TlvDq8ikWAM"
            style={{
              width: '100%', background: 'var(--surface)',
              border: '1px solid var(--border-soft)', borderRadius: 8,
              padding: '9px 12px', fontSize: 12, color: 'var(--text)', outline: 'none',
            }} />
        </div>

        {/* Agents */}
        <div>
          <p style={{ fontSize: 10, letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 12 }}>
            Pipeline SVG
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AgentCard id="A" icon="🔍" name="Analista de Mercado" role="Pesquisa & validação" color={COLORS.analyst} state={agentStates.A} />
            <AgentCard id="C" icon="✍️" name="Copywriter" role="Narrativas persuasivas" color={COLORS.copywriter} state={agentStates.C} />
            <AgentCard id="E" icon="📝" name="Redator" role="Gramática & fluidez" color={COLORS.editor} state={agentStates.E} />
            <AgentCard id="N" icon="🎙️" name="Narrador" role="ElevenLabs TTS" color={COLORS.narrator} state={agentStates.N} />
          </div>
        </div>

        <button onClick={startPipeline} disabled={isRunning} style={{
          background: isRunning ? 'var(--surface)' : 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
          color: isRunning ? 'var(--text-dim)' : 'var(--bg)',
          border: 'none', borderRadius: 10, padding: '14px',
          fontSize: 13, fontWeight: 500, letterSpacing: 1, cursor: isRunning ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {isRunning ? <><span className="spinner" />Processando...</> : '▶  Gerar 10 Copys'}
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Progress */}
        <div style={{ height: 2, background: 'var(--border-soft)' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--gold-dim), var(--gold))',
            transition: 'width 0.6s ease',
          }} />
        </div>

        {/* Pipeline logs */}
        {(logs.length > 0 || isRunning) && (
          <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 10, letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Log do Pipeline
            </p>
            {logs.map((step, i) => (
              <StepBlock key={i} step={step} collapsed={collapsedSteps.has(i)} onToggle={() => toggleStep(i)} />
            ))}
            {isRunning && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-dim)', fontSize: 13 }}>
                <span className="spinner" />Agente processando...
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {logs.length === 0 && copies.length === 0 && !isRunning && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 16, padding: '60px', color: 'var(--text-muted)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, opacity: 0.3 }}>⬡</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--text-dim)' }}>
              Pipeline SVG pronto
            </h2>
            <p style={{ fontSize: 14, maxWidth: 340, lineHeight: 1.6 }}>
              {projectFiles.length > 0
                ? `${projectFiles.length} PDF(s) carregado(s). Clique em Gerar 10 Copys para iniciar.`
                : 'Adicione PDFs do produto para contextualizar os agentes, depois clique em Gerar 10 Copys.'}
            </p>
          </div>
        )}

        {/* Copies */}
        {copies.length > 0 && (
          <div style={{ padding: '0 32px 32px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-soft)',
            }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300 }}>
                Copys Geradas
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{
                  fontSize: 12, color: 'var(--text-dim)', background: 'var(--surface)',
                  padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border-soft)',
                }}>
                  {copies.length} textos
                </span>
                <button onClick={exportTxt} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
                  padding: '6px 14px', fontSize: 11, color: 'var(--gold)', cursor: 'pointer', letterSpacing: 1,
                }}>↓ TXT</button>
                <button onClick={exportJson} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
                  padding: '6px 14px', fontSize: 11, color: 'var(--gold)', cursor: 'pointer', letterSpacing: 1,
                }}>↓ JSON</button>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 16,
            }}>
              {copies.map((copy, i) => (
                <div key={i} className="animate-fade-in" style={{
                  animationDelay: `${i * 0.06}s`,
                  background: 'var(--bg2)', border: '1px solid var(--border-soft)',
                  borderRadius: 12, overflow: 'hidden',
                  transition: 'border-color 0.2s, transform 0.2s',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
                    ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-soft)'
                    ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                  }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px 10px', borderBottom: '1px solid var(--border-soft)',
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 2, fontWeight: 500 }}>
                      COPY {String(i + 1).padStart(2, '0')}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => copyCopyText(copy.text)} style={{
                        background: 'var(--surface)', border: '1px solid var(--border-soft)',
                        borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--text-dim)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      }}>📋 Copiar</button>
                      <button
                        onClick={() => copy.audioUrl
                          ? document.getElementById(`audio-${i}`)?.querySelector('audio')?.play()
                          : narrateSingle(i)
                        }
                        disabled={copy.narrating}
                        style={{
                          background: copy.audioUrl ? 'rgba(160,106,191,0.15)' : 'var(--surface)',
                          border: `1px solid ${copy.audioUrl ? 'var(--narrator)' : 'var(--border-soft)'}`,
                          borderRadius: 6, padding: '4px 10px', fontSize: 11,
                          color: copy.audioUrl ? 'var(--narrator)' : 'var(--text-dim)',
                          cursor: copy.narrating ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4,
                          animation: copy.narrating ? 'pulse 1.5s infinite' : 'none',
                        }}>
                        {copy.narrating ? <><span className="spinner" />Narrando</> : copy.audioUrl ? '🔊 Ouvir' : '🎙 Narrar'}
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: 16, fontSize: 13, lineHeight: 1.8, color: 'var(--text-dim)', whiteSpace: 'pre-wrap' }}>
                    {copy.text}
                  </div>
                  {copy.audioUrl && (
                    <div id={`audio-${i}`} style={{ padding: '10px 16px', borderTop: '1px solid var(--border-soft)' }}>
                      <audio controls src={copy.audioUrl} style={{ width: '100%', height: 36 }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, right: 32,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '14px 20px', fontSize: 13, color: 'var(--text)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 9998,
          animation: 'fadeSlideIn 0.3s ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
