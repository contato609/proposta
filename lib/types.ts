export type ProjectType = 'loteamento' | 'vertical'
export type Channel =
  | 'redes sociais (Facebook/Instagram)'
  | 'Google Ads'
  | 'WhatsApp / Disparos'
  | 'TV / Rádio'
  | 'todos os canais'

export interface Project {
  id: string
  user_id: string
  name: string
  type: ProjectType
  location: string
  target_audience: string | null
  differentials: string | null
  price_range: string | null
  channel: Channel
  created_at: string
  updated_at: string
}

export interface ProjectFile {
  id: string
  project_id: string
  file_name: string
  file_path: string
  file_size: number | null
  created_at: string
}

export interface PipelineRun {
  id: string
  project_id: string
  status: 'running' | 'completed' | 'error'
  analyst_output: string | null
  copywriter_output: string | null
  editor_output: string | null
  error_message: string | null
  created_at: string
}

export interface Copy {
  id: string
  pipeline_run_id: string
  project_id: string
  copy_number: number
  text: string
  audio_url: string | null
  created_at: string
}

export interface ProjectWithStats extends Project {
  copy_count: number
  last_run_at: string | null
  file_count: number
}
