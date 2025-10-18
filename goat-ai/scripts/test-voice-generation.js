// Test ElevenLabs Voice Design API
require("dotenv").config({ path: ".env.local" });

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;

if (!ELEVEN_API_KEY) {
  console.error("❌ ELEVEN_API_KEY not found in .env.local");
  process.exit(1);
}

async function testVoiceGeneration() {
  console.log("🧪 Testing ElevenLabs Voice Design API...\n");

  // Test voice description
  const testVoiceDescription =
    "middle-aged male with American accent, authoritative and confident tone, measured delivery";
  const testPreviewText =
    "We need to be stubborn on vision but flexible on details. Innovation is what drives progress in any organization.";

  console.log("📝 Voice Description:", testVoiceDescription);
  console.log("📝 Preview Text:", testPreviewText);
  console.log("\n⏳ Generating voice...\n");

  try {
    const response = await fetch(
      "https://api.elevenlabs.io/v1/voice-generation/generate-voice",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVEN_API_KEY,
        },
        body: JSON.stringify({
          voice_description: testVoiceDescription,
          text: testPreviewText,
          gender: "male",
        }),
      }
    );

    console.log("📡 Response Status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("\n❌ Voice Generation Failed:");
      console.error("Status:", response.status);
      console.error("Response:", errorText);

      if (response.status === 403 || response.status === 402) {
        console.log("\n💡 This error means:");
        console.log(
          "   - Voice Design requires ElevenLabs Creator plan ($22/mo) or higher"
        );
        console.log("   - Your current plan doesn't include Voice Design");
        console.log("   - Check your plan at: https://elevenlabs.io/pricing");
        console.log("\n🔄 Fallback: Using gender-based default voices instead");
      }
      return;
    }

    const data = await response.json();

    console.log("\n✅ Voice Generation Successful!");
    console.log("🎤 Generated Voice ID:", data.voice_id);

    if (data.sample_audio_url) {
      console.log("🔊 Sample Audio URL:", data.sample_audio_url);
    }

    console.log("\n✨ This voice can now be used for personas!");
  } catch (error) {
    console.error("\n❌ Error during voice generation:");
    console.error(error.message);
  }
}

// Also check account info
async function checkAccount() {
  console.log("👤 Checking ElevenLabs account...\n");

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: {
        "xi-api-key": ELEVEN_API_KEY,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Account connected");
      console.log("   Tier:", data.subscription?.tier || "Unknown");
      console.log(
        "   Character count:",
        data.subscription?.character_count || 0
      );
      console.log(
        "   Character limit:",
        data.subscription?.character_limit || 0
      );
      console.log("");
    }
  } catch (error) {
    console.log("⚠️  Could not fetch account info");
  }
}

async function main() {
  await checkAccount();
  await testVoiceGeneration();
}

main();
