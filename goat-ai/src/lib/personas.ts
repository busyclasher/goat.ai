import { supabase, type Persona } from "./supabase";

// In-memory storage for demo mode
const demoPersonas: Map<string, Persona> = new Map();

export async function getPersona(slug: string): Promise<Persona | null> {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // Demo mode: use in-memory storage
  if (demoMode) {
    return demoPersonas.get(slug) || null;
  }

  // Real mode: use Supabase
  const { data, error } = await supabase
    .from("personas")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching persona:", error);
    return null;
  }

  return data;
}

export async function listPersonas(): Promise<Persona[]> {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // Demo mode: return in-memory personas
  if (demoMode) {
    return Array.from(demoPersonas.values());
  }

  // Real mode: use Supabase
  const { data, error } = await supabase
    .from("personas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching personas:", error);
    return [];
  }

  return data || [];
}

export async function createPersona(
  personaData: Omit<Persona, "id" | "created_at">
): Promise<Persona | null> {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // Demo mode: store in memory
  if (demoMode) {
    const newPersona: Persona = {
      ...personaData,
      id: `demo-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    demoPersonas.set(newPersona.slug, newPersona);
    return newPersona;
  }

  // Real mode: use Supabase
  const { data, error } = await supabase
    .from("personas")
    .insert([personaData])
    .select()
    .single();

  if (error) {
    console.error("Error creating persona:", error);
    return null;
  }

  return data;
}

export async function buildPersona(
  slug: string,
  name?: string,
  query?: string
): Promise<Persona | null> {
  // Check if persona already exists
  const existing = await getPersona(slug);
  if (existing) {
    return existing;
  }

  // Check if we're in demo mode
  const demoMode =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (demoMode) {
    // Return a default mentor persona for demo
    const defaultPersona = {
      slug,
      name: name || "Mentor",
      style_bullets: [
        "Direct and practical advice",
        "Uses real-world examples",
        "Encourages action over analysis",
      ],
      taboo: ["Giving financial advice", "Making medical recommendations"],
      system_prompt:
        "You are a helpful mentor who provides practical, actionable advice. Be direct, encouraging, and use real-world examples when possible. Keep responses concise and focused.",
      sources: [],
    };

    return await createPersona(defaultPersona);
  }

  try {
    // Call the persona building function
    const personaData = await buildPersonaFromExa(slug, name, query || slug);
    return await createPersona(personaData);
  } catch (error) {
    console.error("Error building persona:", error);

    // Fallback to default mentor persona
    const defaultPersona = {
      slug,
      name: name || "Mentor",
      style_bullets: [
        "Direct and practical advice",
        "Uses real-world examples",
        "Encourages action over analysis",
      ],
      taboo: ["Giving financial advice", "Making medical recommendations"],
      system_prompt:
        "You are a helpful mentor who provides practical, actionable advice. Be direct, encouraging, and use real-world examples when possible. Keep responses concise and focused.",
      sources: [],
    };

    return await createPersona(defaultPersona);
  }
}

async function buildPersonaFromExa(
  slug: string,
  name?: string,
  query?: string
): Promise<Omit<Persona, "id" | "created_at">> {
  const exaApiKey = process.env.EXA_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;

  // Use slug as default query if not provided
  const searchQuery = query || slug;

  if (!exaApiKey || !groqApiKey) {
    throw new Error("Missing API keys");
  }

  try {
    // Search for content about the persona
    const searchResponse = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": exaApiKey,
      },
      body: JSON.stringify({
        query: searchQuery,
        numResults: 20,
        type: "auto",
        useAutoprompt: true,
        contents: {
          text: true,
        },
      }),
    });

    if (!searchResponse.ok) {
      throw new Error(`Exa API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    if (!searchData.results || searchData.results.length === 0) {
      throw new Error("No results found from Exa");
    }

    // Extract text content and compact to 2000 chars
    const snippets = searchData.results
      .map(
        (result: { text?: string; snippet?: string }) =>
          result.text || result.snippet || ""
      )
      .filter((text: string) => text.length > 0)
      .join("\n\n")
      .substring(0, 2000);

    // Generate persona data using Groq
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `Analyze these content snippets about ${
                name || slug
              } and extract their unique personality:

1. COMMUNICATION PATTERNS:
   - Sentence structure (short/punchy vs long/flowing)
   - Formality level (casual, professional, or mixed)
   - Signature phrases or linguistic quirks
   - Use of questions, metaphors, analogies, or stories
   - Humor style (if any)

2. EXPERTISE & PERSPECTIVE:
   - Top 3 topics they discuss most
   - Their unique angle or approach to these topics
   - Real examples or experiences they reference

3. EMOTIONAL TONE:
   - Energy level (enthusiastic, measured, provocative, calm)
   - How they balance vulnerability with authority
   - Optimism vs realism

4. INTERACTION STYLE:
   - Do they ask questions or make statements?
   - Advice-giving approach (direct vs exploratory)
   - Level of detail (concise vs comprehensive)

5. BOUNDARIES:
   - Topics they avoid or wouldn't discuss
   - Types of advice they don't give

Based on this analysis, generate:
- styleBullets: 5-7 specific traits that capture HOW they communicate
- taboo: 3-5 specific topics/approaches to avoid
- systemPrompt: A detailed prompt (≤400 tokens) that naturally integrates these patterns. Make it specific, actionable, and authentic - not generic. Include concrete instructions about tone, pacing, and response style. Reference their real expertise areas.

Format as JSON with keys: styleBullets, taboo, systemPrompt`,
            },
            {
              role: "user",
              content: snippets,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }
    );

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.status}`);
    }

    const groqData = await groqResponse.json();
    const personaData = JSON.parse(groqData.choices[0].message.content);

    return {
      slug,
      name: name || slug,
      style_bullets: personaData.styleBullets || [],
      taboo: personaData.taboo || [],
      system_prompt: personaData.systemPrompt || "You are a helpful assistant.",
      sources: searchData.results.map(
        (result: { title?: string; url?: string; snippet?: string }) => ({
          title: result.title || "Untitled",
          url: result.url || "",
          snippet: result.snippet || "",
        })
      ),
    };
  } catch (error) {
    console.error("Error building persona from Exa:", error);
    throw error;
  }
}
