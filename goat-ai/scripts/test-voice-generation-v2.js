// Test ElevenLabs Voice Design API with correct endpoints
require("dotenv").config({ path: ".env.local" });

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;

async function testVoiceGeneration() {
  console.log("🧪 Testing ElevenLabs Voice Design API (2-step process)...\n");

  const voiceDescription =
    "middle-aged male with American accent, authoritative and confident tone, measured delivery";
  const previewText =
    "We need to be stubborn on vision but flexible on details. Innovation is what drives progress in any organization.";
  const gender = "male";

  console.log("📝 Voice Description:", voiceDescription);
  console.log("📝 Preview Text:", previewText);
  console.log("📝 Gender:", gender);

  try {
    // Step 1: Design the voice
    console.log("\n⏳ Step 1: Designing voice...");
    const designResponse = await fetch(
      "https://api.elevenlabs.io/v1/text-to-voice/design",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVEN_API_KEY,
        },
        body: JSON.stringify({
          voice_description: voiceDescription,
          text: previewText,
          gender: gender,
        }),
      }
    );

    console.log(
      "📡 Design Status:",
      designResponse.status,
      designResponse.statusText
    );

    if (!designResponse.ok) {
      const errorText = await designResponse.text();
      console.error("\n❌ Design Failed:");
      console.error("Response:", errorText);
      return;
    }

    const designData = await designResponse.json();
    console.log("✅ Design created!");
    console.log("📦 Response structure:");
    console.log("  - Top level keys:", Object.keys(designData));

    if (designData.previews && designData.previews.length > 0) {
      console.log("  - Preview[0] keys:", Object.keys(designData.previews[0]));
      const generatedVoiceId = designData.previews[0].generated_voice_id;
      console.log("🎭 Generated Voice ID:", generatedVoiceId);

      if (!generatedVoiceId) {
        console.error("❌ No generated_voice_id found!");
        return;
      }
    } else {
      console.error("❌ No previews in response!");
      return;
    }

    const generatedVoiceId = designData.previews[0].generated_voice_id;

    // Step 2: Create permanent voice
    console.log("\n⏳ Step 2: Creating permanent voice...");
    const createResponse = await fetch(
      "https://api.elevenlabs.io/v1/text-to-voice",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVEN_API_KEY,
        },
        body: JSON.stringify({
          voice_name: voiceDescription.substring(0, 50),
          voice_description: voiceDescription,
          generated_voice_id: designData.generated_voice_id,
        }),
      }
    );

    console.log(
      "📡 Create Status:",
      createResponse.status,
      createResponse.statusText
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("\n❌ Creation Failed:");
      console.error("Response:", errorText);
      return;
    }

    const createData = await createResponse.json();
    console.log("\n✅ Voice Created Successfully!");
    console.log("🎤 Voice ID:", createData.voice_id);
    console.log("📛 Voice Name:", createData.name);
    console.log("\n✨ This voice can now be used for TTS!");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

testVoiceGeneration();
