import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/projects/[id]/pdf?fileId=xxx — returns PDF as base64 for Claude
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { id: projectId } = await params
  const fileId = new URL(request.url).searchParams.get('fileId')

  // If no fileId, get the first PDF of the project
  const query = supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)

  if (fileId) query.eq('id', fileId)

  const { data: files, error } = await query.order('created_at').limit(1)
  if (error || !files?.length) return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 404 })

  const file = files[0]
  const { data: blob, error: downloadError } = await supabase.storage
    .from('project-files')
    .download(file.file_path)

  if (downloadError || !blob) {
    return NextResponse.json({ error: 'Erro ao baixar o arquivo.' }, { status: 500 })
  }

  const arrayBuffer = await blob.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  return NextResponse.json({ base64, fileName: file.file_name })
}
