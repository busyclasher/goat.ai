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
    console.error("Error fetching persona:", JSON.stringify(error, null, 2));
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
    console.error("Error creating persona:", JSON.stringify(error, null, 2));
    return null;
  }

  return data;
}

export async function buildPersona(
  slug: string,
  name?: string,
  query?: string
): Promise<Persona | null> {
  // Sanitize slug to remove hyphens and make it lowercase
  const sanitizedSlug = slug.replace(/-/g, "").toLowerCase();

  // Check if persona already exists with original or sanitized slug
  let existing = await getPersona(slug);
  if (existing) return existing;
  
  if (slug !== sanitizedSlug) {
    existing = await getPersona(sanitizedSlug);
    if (existing) return existing;
  }

  // Check if we're in demo mode
  const demoMode =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (demoMode) {
    // Return a default mentor persona for demo
    const defaultPersona = {
      slug: sanitizedSlug, // Use sanitized slug
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
    const personaData = await buildPersonaFromExa(sanitizedSlug, name, query || slug); // Use sanitized slug
    return await createPersona(personaData);
  } catch (error) {
    console.error("Error building persona:", error);

    // Fallback to default mentor persona
    const defaultPersona = {
      slug: sanitizedSlug, // Use sanitized slug
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

export async function buildPersonaFromExa(
  slug: string,
  name?: string,
  query?: string
): Promise<
  Omit<Persona, "id" | "created_at"> & {
    gender?: string;
    voiceDescription?: string;
    sampleText?: string;
  }
> {
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

6. GENDER IDENTIFICATION:
   - Based on the person's name and content, determine their gender: "male", "female", or "other"

7. VOICE CHARACTERISTICS:
   Based on the person's profile, infer their likely voice characteristics:

   AGE RANGE:
   - young adult (20-35): energetic, modern, quick
   - middle-aged (36-55): authoritative, mature, steady
   - mature (56+): wise, measured, deep

   VOCAL PACE:
   - fast: rapid-fire, energetic speakers (e.g., entrepreneurs, coaches)
   - moderate: balanced, conversational (most people)
   - slow: deliberate, thoughtful (e.g., academics, philosophers)

   ENERGY LEVEL:
   - high-energy: enthusiastic, animated (e.g., motivational speakers)
   - measured: professional, controlled (e.g., executives, experts)
   - calm: soothing, gentle (e.g., therapists, spiritual teachers)

   ACCENT:
   - American: default for US-based individuals
   - British: UK-based individuals or those with British education
   - Australian: Australia-based individuals
   - neutral: international or unclear origin
   - other: specify if notable (e.g., Indian, French, etc.)

   TONE QUALITIES (select 2-3):
   - authoritative: commands respect, decisive
   - warm: friendly, approachable, caring
   - confident: self-assured, bold
   - professional: formal, polished
   - casual: relaxed, conversational
   - analytical: logical, precise
   - passionate: intense, emotional
   - humorous: playful, witty

   VOCAL TEXTURE:
   - smooth: polished, easy to listen to
   - clear: crisp, articulate
   - resonant: rich, full-bodied
   - raspy: textured, distinctive
   - soft: gentle, quiet
   - deep: low-pitched, commanding

   OUTPUT FORMAT:
   Create a single-sentence voice description:
   "[age] [gender] with [accent] accent, [tone1] and [tone2] tone, [pace] delivery"

   Examples:
   - "middle-aged male with American accent, authoritative and confident tone, measured delivery"
   - "young adult female with British accent, warm and professional tone, moderate delivery"
   - "mature male with neutral accent, analytical and calm tone, slow delivery"

   Also create a sample text (100-150 characters) that captures how this person would naturally speak,
   using their signature phrases, topics, or communication style.

Based on this analysis, generate:
- description: A concise, engaging description (max 2 sentences) suitable for display on a landing page. Focus on who they are and their key expertise. Write in third person (e.g., "Jeff Bezos is the founder of Amazon and Blue Origin. He's known for customer obsession and long-term thinking."). Make it compelling and brief for users choosing which persona to chat with.
- styleBullets: 5-7 specific traits that capture HOW they communicate
- taboo: 3-5 specific topics/approaches to avoid
- systemPrompt: A detailed prompt (≤400 tokens) that MUST start with "You are [Full Name]". The prompt should instruct the AI to embody and respond AS this person in first person, NOT to talk TO them. Make it specific, actionable, and authentic - not generic. Include concrete instructions about their communication style, tone, pacing, and response patterns. Reference their real expertise areas. IMPORTANT: Instruct the AI to use natural narrative context to convey emotion and delivery (e.g., "said thoughtfully", "chuckled", "pausing", "with enthusiasm", "whispered"). This helps voice synthesis interpret emotional delivery without reading explicit tags aloud. Example: "You are Jeff Bezos, founder of Amazon and Blue Origin. When you find something amusing, let it show naturally with 'chuckled' or 'with a laugh'. When being thoughtful, use phrases like 'pausing to consider' or 'said thoughtfully'." NOT bracket tags like [chuckles] or [thoughtfully].
- gender: "male", "female", or "other"
- voiceDescription: single sentence as described above
- sampleText: 100-150 chars in their voice
- suggestedQuestions: An array of exactly 4 persona-specific questions that users might want to ask. Make these questions:
  * Specific to this person's unique expertise and experience
  * Open-ended to encourage engaging conversations
  * Varied in topic (covering different aspects of their knowledge/perspective)
  * Conversational and natural (e.g., "How do you think about long-term strategy?" not "Explain your strategy framework")
  * Questions should feel like things you'd naturally ask THIS specific person in a mentorship conversation

Format as JSON with keys: description, styleBullets, taboo, systemPrompt, gender, voiceDescription, sampleText, suggestedQuestions`,
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
      description: personaData.description,
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
      suggested_questions: personaData.suggestedQuestions || [],
      gender: personaData.gender || "other",
      voiceDescription: personaData.voiceDescription,
      sampleText: personaData.sampleText,
    };
  } catch (error) {
    console.error("Error building persona from Exa:", error);
    throw error;
  }
}
