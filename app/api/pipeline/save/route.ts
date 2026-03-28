import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { projectId, analystOutput, copywriterOutput, editorOutput, copies } = await request.json()

  if (!projectId || !copies?.length) {
    return NextResponse.json({ error: 'projectId e copies são obrigatórios.' }, { status: 400 })
  }

  // Create pipeline run record
  const { data: run, error: runError } = await supabase
    .from('pipeline_runs')
    .insert({
      project_id: projectId,
      status: 'completed',
      analyst_output: analystOutput,
      copywriter_output: copywriterOutput,
      editor_output: editorOutput,
    })
    .select()
    .single()

  if (runError) return NextResponse.json({ error: runError.message }, { status: 500 })

  // Save all copies
  const copyRows = copies.map((text: string, i: number) => ({
    pipeline_run_id: run.id,
    project_id: projectId,
    copy_number: i + 1,
    text,
  }))

  const { error: copyError } = await supabase.from('copies').insert(copyRows)
  if (copyError) return NextResponse.json({ error: copyError.message }, { status: 500 })

  return NextResponse.json({ runId: run.id, saved: copyRows.length })
}
