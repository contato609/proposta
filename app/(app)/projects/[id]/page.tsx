import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProjectPipeline from '@/components/ProjectPipeline'

export const dynamic = 'force-dynamic'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const { data: files } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', id)
    .order('created_at')

  const { data: copies } = await supabase
    .from('copies')
    .select('*, pipeline_runs(created_at)')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  return <ProjectPipeline project={project} files={files ?? []} initialCopies={copies ?? []} />
}
