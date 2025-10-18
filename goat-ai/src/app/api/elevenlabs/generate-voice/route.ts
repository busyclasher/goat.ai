import { NextRequest, NextResponse } from "next/server";

// ElevenLabs Voice Design API - generates custom voices from text descriptions
// Requires Creator plan or higher on ElevenLabs
export async function POST(request: NextRequest) {
  try {
    const { voiceDescription, previewText, gender } = await request.json();

    if (!voiceDescription || !previewText) {
      return NextResponse.json(
        { error: "Voice description and preview text are required" },
        { status: 400 }
      );
    }

    const elevenApiKey = process.env.ELEVEN_API_KEY;
    if (!elevenApiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }

    console.log("[Voice Gen] Generating custom voice...");
    console.log("[Voice Gen] Description:", voiceDescription);
    console.log(
      "[Voice Gen] Preview text:",
      previewText.substring(0, 50) + "..."
    );

    // Step 1: Design the voice (get preview)
    console.log("[Voice Gen] Step 1: Designing voice...");
    const designResponse = await fetch(
      "https://api.elevenlabs.io/v1/text-to-voice/design",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": elevenApiKey,
        },
        body: JSON.stringify({
          voice_description: voiceDescription,
          text: previewText,
          gender: gender || "male",
        }),
      }
    );

    if (!designResponse.ok) {
      const errorText = await designResponse.text();
      console.error(
        "[Voice Gen] Design API error:",
        designResponse.status,
        errorText
      );

      // Check if it's a plan limitation
      if (designResponse.status === 403 || designResponse.status === 402) {
        return NextResponse.json(
          {
            error: "Voice generation requires a higher ElevenLabs plan",
            fallback: true,
          },
          { status: 403 }
        );
      }

      throw new Error(`Voice design failed: ${designResponse.status}`);
    }

    const designData = await designResponse.json();

    // The API returns the voice_id in previews[0].generated_voice_id
    if (!designData.previews || designData.previews.length === 0) {
      console.error("[Voice Gen] No previews in response:", designData);
      throw new Error("Voice generation failed: no previews returned");
    }

    const generatedVoiceId = designData.previews[0].generated_voice_id;

    if (!generatedVoiceId) {
      console.error(
        "[Voice Gen] No generated_voice_id in preview:",
        designData.previews[0]
      );
      throw new Error("Voice generation failed: no voice ID returned");
    }

    console.log(
      "[Voice Gen] ✅ Voice generated successfully! ID:",
      generatedVoiceId
    );
    console.log("[Voice Gen] This voice ID can be used directly for TTS");

    return NextResponse.json({
      success: true,
      voice_id: generatedVoiceId,
      sample_audio_base64: designData.previews[0].audio_base_64,
    });
  } catch (error: any) {
    console.error("[Voice Gen] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate voice",
        fallback: true,
      },
      { status: 500 }
    );
  }
}
