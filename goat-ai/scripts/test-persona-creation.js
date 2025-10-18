// Test script to debug persona creation issue
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPersonaCreation() {
  console.log("🧪 Testing persona creation...\n");

  // Test persona data
  const testPersona = {
    slug: "test-persona-" + Date.now(),
    name: "Test Persona",
    style_bullets: ["Test trait 1", "Test trait 2"],
    taboo: ["Test taboo"],
    system_prompt: "You are a test persona.",
    sources: [],
    voice_id: "21m00Tcm4TlvDq8ikWAM",
  };

  console.log("📝 Attempting to insert:");
  console.log(JSON.stringify(testPersona, null, 2));
  console.log("");

  const { data, error } = await supabase
    .from("personas")
    .insert([testPersona])
    .select()
    .single();

  if (error) {
    console.error("❌ Error creating persona:");
    console.error(JSON.stringify(error, null, 2));
    console.log("\n💡 Common issues:");
    console.log("   - Check if voice_id column exists in database");
    console.log("   - Verify all migrations have been run");
    console.log("   - Check RLS policies allow inserts");
  } else {
    console.log("✅ Success! Created persona:");
    console.log(JSON.stringify(data, null, 2));

    // Clean up test persona
    await supabase.from("personas").delete().eq("id", data.id);
    console.log("\n🧹 Test persona cleaned up");
  }
}

testPersonaCreation();
