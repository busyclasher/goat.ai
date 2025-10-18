// Check what voice_id is assigned to a persona
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPersonaVoices() {
  console.log("🔍 Checking all personas and their voice IDs...\n");

  const { data: personas, error } = await supabase
    .from("personas")
    .select("slug, name, voice_id")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error:", error);
    return;
  }

  const FEMALE_VOICE = "Qv0aP47SJsL43Pn6x7k9";
  const MALE_VOICE = "21m00Tcm4TlvDq8ikWAM";

  personas.forEach((p) => {
    let voiceType = "Unknown";
    if (p.voice_id === FEMALE_VOICE) voiceType = "Female (Sherry)";
    else if (p.voice_id === MALE_VOICE) voiceType = "Male (Default)";
    else if (p.voice_id) voiceType = "Custom";
    else voiceType = "None";

    console.log(`📍 ${p.name}`);
    console.log(`   Slug: ${p.slug}`);
    console.log(`   Voice: ${voiceType}`);
    console.log(`   Voice ID: ${p.voice_id || "null"}`);
    console.log("");
  });

  console.log(`Total personas: ${personas.length}`);
}

checkPersonaVoices();

