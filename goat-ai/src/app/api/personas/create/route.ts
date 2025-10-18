import { NextRequest, NextResponse } from "next/server";
import { createPersona, buildPersonaFromExa } from "@/lib/personas";

// Using user-selected gender to assign appropriate voice
// Female voice: Qv0aP47SJsL43Pn6x7k9 (Sherry's voice)
// Male voice: CwhRBWXzGAHq8TQ4Fs17 (Roger - confident, persuasive male voice)
const FEMALE_VOICE_ID = "Qv0aP47SJsL43Pn6x7k9";
const MALE_VOICE_ID = "CwhRBWXzGAHq8TQ4Fs17";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, query, gender } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    if (!slug) {
      return NextResponse.json(
        { error: "Invalid name provided" },
        { status: 400 }
      );
    }

    // Check for API keys
    const exaApiKey = process.env.EXA_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!exaApiKey || !groqApiKey) {
      return NextResponse.json(
        {
          error:
            "API keys not configured. Please set EXA_API_KEY and GROQ_API_KEY.",
        },
        { status: 500 }
      );
    }

    // Build persona using Exa API
    console.log("[Persona Creation] Building persona from Exa...");
    const personaData = await buildPersonaFromExa(slug, name, query || name);

    console.log(
      "[Persona Creation] Detected gender from Groq:",
      personaData.gender
    );

    // Use user-selected gender for voice assignment (with fallback to detected gender)
    const selectedGender = gender || personaData.gender || "male";
    console.log("[Persona Creation] Selected gender:", selectedGender);

    // Assign voice based on gender (simple gender-based assignment)
    const voiceId =
      selectedGender === "female" ? FEMALE_VOICE_ID : MALE_VOICE_ID;
    console.log(
      `[Persona Creation] Assigned ${selectedGender} voice:`,
      voiceId
    );

    // Remove temporary fields from persona data before saving (not in DB schema)
    const { gender: detectedGender, ...personaToSave } = personaData;

    // Ensure all required fields are present with proper defaults
    const personaForDB = {
      slug: personaToSave.slug,
      name: personaToSave.name,
      style_bullets: personaToSave.style_bullets || [],
      taboo: personaToSave.taboo || [],
      system_prompt:
        personaToSave.system_prompt || "You are a helpful assistant.",
      sources: personaToSave.sources || [],
      voice_id: voiceId,
    };

    console.log("[Persona Creation] Saving to database with data:");
    console.log(JSON.stringify(personaForDB, null, 2));

    // Create persona with voice_id
    const newPersona = await createPersona(personaForDB);

    if (!newPersona) {
      console.error(
        "[Persona Creation] createPersona returned null - check Supabase logs above"
      );
      return NextResponse.json(
        {
          error:
            "Failed to create persona in database. Check server logs for details.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      persona: newPersona,
      gender: selectedGender,
      voiceId: voiceId,
    });
  } catch (error: any) {
    console.error("Error creating persona:", error);

    // Provide user-friendly error messages
    if (error.message?.includes("Exa API error")) {
      return NextResponse.json(
        { error: "Failed to fetch information from Exa. Please try again." },
        { status: 500 }
      );
    }

    if (error.message?.includes("Groq API error")) {
      return NextResponse.json(
        { error: "Failed to generate persona. Please try again." },
        { status: 500 }
      );
    }

    if (error.message?.includes("No results found")) {
      return NextResponse.json(
        {
          error:
            "No information found for this person. Try adding more context or a different name.",
        },
        { status: 404 }
      );
    }

    if (error.code === "23505") {
      // PostgreSQL unique violation error
      return NextResponse.json(
        { error: "A persona with this name already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create persona" },
      { status: 500 }
    );
  }
}
