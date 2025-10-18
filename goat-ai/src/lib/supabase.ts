import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Log the variables to the server console during initialization
console.log("Supabase URL from env:", supabaseUrl ? "Loaded" : "Missing");
console.log("Supabase Anon Key from env:", supabaseAnonKey ? "Loaded" : "Missing");


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and anonymous key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Persona {
  id: string
  slug: string
  name: string
  description?: string
  style_bullets: string[]
  taboo: string[]
  system_prompt: string
  sources: Array<{
    title: string
    url: string
    snippet: string
  }>
  avatar_url?: string
  voice_id?: string
  suggested_questions?: string[]
  created_at: string
}

export interface Conversation {
  id: string
  persona_id: string
  user_id?: string
  title?: string
  created_at: string
  updated_at: string
  messages?: Message[]
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  audio_url?: string
  persona_id?: string
  persona?: Persona
  created_at: string
}