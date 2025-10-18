import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Persona {
  id: string
  slug: string
  name: string
  style_bullets: string[]
  taboo: string[]
  system_prompt: string
  sources: Array<{
    title: string
    url: string
    snippet: string
  }>
  created_at: string
}

export interface Conversation {
  id: string
  persona_id: string
  user_id?: string
  title?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  audio_url?: string
  created_at: string
}
