// Script to delete a persona by slug
// Usage: node scripts/delete-persona.js <slug>

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deletePersona(slug) {
  console.log(`🗑️  Attempting to delete persona: ${slug}`);

  const { data, error } = await supabase
    .from("personas")
    .delete()
    .eq("slug", slug)
    .select();

  if (error) {
    console.error("❌ Error deleting persona:", error.message);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log("✅ Successfully deleted persona:");
    console.log(`   Name: ${data[0].name}`);
    console.log(`   Slug: ${data[0].slug}`);
  } else {
    console.log("⚠️  No persona found with that slug");
  }
}

const slug = process.argv[2];

if (!slug) {
  console.error("❌ Please provide a persona slug");
  console.error("Usage: node scripts/delete-persona.js <slug>");
  console.error("Example: node scripts/delete-persona.js jeff-bezos");
  process.exit(1);
}

deletePersona(slug);
