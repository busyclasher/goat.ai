import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    const elevenApiKey = process.env.ELEVEN_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    // Try ElevenLabs STT first if available
    if (elevenApiKey) {
      try {
        const audioBuffer = await audioFile.arrayBuffer();
        const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: {
            "xi-api-key": elevenApiKey,
          },
          body: audioBuffer,
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({ text: data.text || "" });
        }
      } catch (error) {
        console.warn("ElevenLabs STT failed, falling back to Whisper:", error);
      }
    }

    // Fallback to Groq (Note: Groq doesn't have STT, so we'll return an error)
    if (!groqApiKey) {
      return NextResponse.json({ error: "No STT service configured" }, { status: 500 });
    }

    // Groq doesn't provide STT service, so we'll return an error message
    return NextResponse.json({ 
      error: "Speech-to-text not available. Please use text input instead." 
    }, { status: 501 });
  } catch (error) {
    console.error("STT error:", error);
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 });
  }
}
