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
        // ElevenLabs expects multipart/form-data with 'audio' field
        const sttFormData = new FormData();
        sttFormData.append('audio', audioFile);
        
        const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: {
            "xi-api-key": elevenApiKey,
          },
          body: sttFormData,
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({ text: data.text || "" });
        } else {
          const errorText = await response.text();
          console.error("ElevenLabs STT error:", response.status, errorText);
        }
      } catch (error) {
        console.error("ElevenLabs STT failed:", error);
      }
    }

    // Fallback to Groq Whisper API
    if (groqApiKey) {
      try {
        // Groq supports Whisper for STT
        const whisperFormData = new FormData();
        whisperFormData.append('file', audioFile);
        whisperFormData.append('model', 'whisper-large-v3');
        whisperFormData.append('response_format', 'json');
        
        const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
          },
          body: whisperFormData,
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({ text: data.text || "" });
        } else {
          const errorText = await response.text();
          console.error("Groq Whisper error:", response.status, errorText);
        }
      } catch (error) {
        console.error("Groq Whisper failed:", error);
      }
    }

    // If both services failed
    return NextResponse.json({ 
      error: "Speech-to-text service unavailable. Please check API keys." 
    }, { status: 503 });
  } catch (error) {
    console.error("STT error:", error);
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 });
  }
}
