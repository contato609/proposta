import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/projects — list all projects with stats for the current user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      copies:copies(count),
      project_files:project_files(count),
      pipeline_runs:pipeline_runs(created_at)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ projects: data })
}

// POST /api/projects — create a new project
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const { name, type, location, target_audience, differentials, price_range, channel } = body

  if (!name || !type || !location) {
    return NextResponse.json({ error: 'Nome, tipo e localização são obrigatórios.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: user.id, name, type, location, target_audience, differentials, price_range, channel })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data }, { status: 201 })
}
