import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    console.log("[STT] Audio file received:", audioFile.name, audioFile.size, "bytes", audioFile.type);

    const elevenApiKey = process.env.ELEVEN_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    console.log("[STT] API Keys status:", {
      elevenLabs: elevenApiKey ? `Available (${elevenApiKey.substring(0, 10)}...)` : "Missing",
      groq: groqApiKey ? `Available (${groqApiKey.substring(0, 10)}...)` : "Missing"
    });

    // Try ElevenLabs STT first if available
    if (elevenApiKey) {
      try {
        // Convert File to Buffer for server-side FormData
        const audioBuffer = await audioFile.arrayBuffer();
        const audioBlob = new Blob([audioBuffer], { type: audioFile.type });
        
        // ElevenLabs expects multipart/form-data with 'file' field and 'model_id'
        const sttFormData = new FormData();
        sttFormData.append('file', audioBlob, audioFile.name);
        sttFormData.append('model_id', 'eleven_turbo_v2');
        
        const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: {
            "xi-api-key": elevenApiKey,
          },
          body: sttFormData,
        });

        if (response.ok) {
          const data = await response.json();
          console.log("[STT] ElevenLabs success:", data);
          return NextResponse.json({ text: data.text || "" });
        } else {
          const errorText = await response.text();
          console.error("[STT] ElevenLabs error:", response.status, errorText);
        }
      } catch (error) {
        console.error("[STT] ElevenLabs exception:", error);
      }
    }

    // Fallback to Groq Whisper API
    if (groqApiKey) {
      try {
        console.log("[STT] Trying Groq Whisper as fallback...");
        // Convert File to Buffer for server-side FormData
        const audioBuffer = await audioFile.arrayBuffer();
        const audioBlob = new Blob([audioBuffer], { type: audioFile.type });
        
        // Groq supports Whisper for STT
        const whisperFormData = new FormData();
        whisperFormData.append('file', audioBlob, audioFile.name);
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
          console.log("[STT] Groq Whisper success:", data);
          return NextResponse.json({ text: data.text || "" });
        } else {
          const errorText = await response.text();
          console.error("[STT] Groq Whisper error:", response.status, errorText);
        }
      } catch (error) {
        console.error("[STT] Groq Whisper exception:", error);
      }
    }

    console.error("[STT] All STT services failed");

    // If both services failed
    return NextResponse.json({ 
      error: "Speech-to-text service unavailable. Please check API keys." 
    }, { status: 503 });
  } catch (error) {
    console.error("STT error:", error);
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 });
  }
}
