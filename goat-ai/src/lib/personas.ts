import { supabase, type Persona } from './supabase'

// In-memory storage for demo mode
const demoPersonas: Map<string, Persona> = new Map()

export async function getPersona(slug: string): Promise<Persona | null> {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  // Demo mode: use in-memory storage
  if (demoMode) {
    return demoPersonas.get(slug) || null
  }

  // Real mode: use Supabase
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching persona:', error)
    return null
  }

  return data
}

export async function listPersonas(): Promise<Persona[]> {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  // Demo mode: return in-memory personas
  if (demoMode) {
    return Array.from(demoPersonas.values())
  }

  // Real mode: use Supabase
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching personas:', error)
    return []
  }

  return data || []
}

export async function createPersona(personaData: Omit<Persona, 'id' | 'created_at'>): Promise<Persona | null> {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  // Demo mode: store in memory
  if (demoMode) {
    const newPersona: Persona = {
      ...personaData,
      id: `demo-${Date.now()}`,
      created_at: new Date().toISOString()
    }
    demoPersonas.set(newPersona.slug, newPersona)
    return newPersona
  }

  // Real mode: use Supabase
  const { data, error } = await supabase
    .from('personas')
    .insert([personaData])
    .select()
    .single()

  if (error) {
    console.error('Error creating persona:', error)
    return null
  }

  return data
}

export async function buildPersona(slug: string, name?: string, query?: string): Promise<Persona | null> {
  // Check if persona already exists
  const existing = await getPersona(slug)
  if (existing) {
    return existing
  }

  // Check if we're in demo mode
  const demoMode = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  if (demoMode) {
    // Return a default mentor persona for demo
    const defaultPersona = {
      slug,
      name: name || 'Mentor',
      style_bullets: [
        'Direct and practical advice',
        'Uses real-world examples',
        'Encourages action over analysis'
      ],
      taboo: [
        'Giving financial advice',
        'Making medical recommendations'
      ],
      system_prompt: "You are a helpful mentor who provides practical, actionable advice. Be direct, encouraging, and use real-world examples when possible. Keep responses concise and focused.",
      sources: []
    }
    
    return await createPersona(defaultPersona)
  }

  try {
    // Call the persona building function
    const personaData = await buildPersonaFromExa(slug, name, query || slug)
    return await createPersona(personaData)
  } catch (error) {
    console.error('Error building persona:', error)
    
    // Fallback to default mentor persona
    const defaultPersona = {
      slug,
      name: name || 'Mentor',
      style_bullets: [
        'Direct and practical advice',
        'Uses real-world examples',
        'Encourages action over analysis'
      ],
      taboo: [
        'Giving financial advice',
        'Making medical recommendations'
      ],
      system_prompt: "You are a helpful mentor who provides practical, actionable advice. Be direct, encouraging, and use real-world examples when possible. Keep responses concise and focused.",
      sources: []
    }
    
    return await createPersona(defaultPersona)
  }
}

async function buildPersonaFromExa(slug: string, name?: string, query: string): Promise<Omit<Persona, 'id' | 'created_at'>> {
  const exaApiKey = process.env.EXA_API_KEY
  const groqApiKey = process.env.GROQ_API_KEY

  if (!exaApiKey || !groqApiKey) {
    throw new Error('Missing API keys')
  }

  try {
    // Search for content about the persona
    const searchResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': exaApiKey,
      },
      body: JSON.stringify({
        query,
        numResults: 10,
        type: 'snippet',
        useAutoprompt: true,
      }),
    })

    if (!searchResponse.ok) {
      throw new Error(`Exa API error: ${searchResponse.status}`)
    }

    const searchData = await searchResponse.json()
    
    if (!searchData.results || searchData.results.length === 0) {
      throw new Error('No results found from Exa')
    }

    // Extract snippets and compact to 1200 chars
    const snippets = searchData.results
      .map((result: any) => result.snippet)
      .join(' ')
      .substring(0, 1200)

    // Generate persona data using Groq
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Based on the following content snippets about ${name || slug}, generate a persona profile with:
1. 3-5 style bullets (communication style, approach, etc.)
2. 2-4 taboo topics (things they avoid discussing)
3. A system prompt (≤200 tokens) that sets their role, tone, and formatting

Format as JSON with keys: styleBullets, taboo, systemPrompt`
          },
          {
            role: 'user',
            content: snippets
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.status}`)
    }

    const groqData = await groqResponse.json()
    const personaData = JSON.parse(groqData.choices[0].message.content)

    return {
      slug,
      name: name || slug,
      style_bullets: personaData.styleBullets || [],
      taboo: personaData.taboo || [],
      system_prompt: personaData.systemPrompt || 'You are a helpful assistant.',
      sources: searchData.results.map((result: any) => ({
        title: result.title || 'Untitled',
        url: result.url || '',
        snippet: result.snippet || '',
      })),
    }
  } catch (error) {
    console.error('Error building persona from Exa:', error)
    throw error
  }
}
