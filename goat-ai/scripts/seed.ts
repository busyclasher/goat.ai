import { createClient } from "@supabase/supabase-js";
import personas from "../seed/personas.json";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase credentials in .env.local. Please ensure NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_API_KEY) are set.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log("Seeding personas...");
  for (const p of personas) {
    const { error } = await supabaseAdmin.from("personas").upsert(p, { onConflict: "slug" });
    if (error) console.error(`❌ Failed to insert ${p.slug}:`, error);
    else console.log(`✅ Inserted ${p.slug}`);
  }
}

seed();
