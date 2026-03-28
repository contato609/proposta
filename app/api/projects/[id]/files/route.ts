import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/projects/[id]/files — upload a PDF
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { id: projectId } = await params

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })

  const filePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`
  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('project-files')
    .upload(filePath, arrayBuffer, { contentType: 'application/pdf', upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data, error } = await supabase
    .from('project_files')
    .insert({ project_id: projectId, file_name: file.name, file_path: filePath, file_size: file.size })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ file: data }, { status: 201 })
}

// DELETE /api/projects/[id]/files?fileId=xxx
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { id: projectId } = await params
  const fileId = new URL(request.url).searchParams.get('fileId')
  if (!fileId) return NextResponse.json({ error: 'fileId obrigatório.' }, { status: 400 })

  const { data: fileRecord } = await supabase
    .from('project_files')
    .select('file_path')
    .eq('id', fileId)
    .eq('project_id', projectId)
    .single()

  if (fileRecord) {
    await supabase.storage.from('project-files').remove([fileRecord.file_path])
  }

  const { error } = await supabase.from('project_files').delete().eq('id', fileId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
