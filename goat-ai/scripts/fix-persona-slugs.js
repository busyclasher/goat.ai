const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Service Key is not defined in your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPersonaSlugs() {
  console.log('Fetching personas...');
  const { data: personas, error } = await supabase
    .from('personas')
    .select('id, slug');

  if (error) {
    console.error('Error fetching personas:', error);
    return;
  }

  const personasToFix = personas.filter(p => p.slug.includes('-'));

  if (personasToFix.length === 0) {
    console.log('No personas with hyphens in slugs found. Nothing to do.');
    return;
  }

  console.log(`Found ${personasToFix.length} persona(s) to fix...`);

  for (const persona of personasToFix) {
    const newSlug = persona.slug.replace(/-/g, '').toLowerCase();
    console.log(`Updating slug for persona ID ${persona.id}: "${persona.slug}" -> "${newSlug}"`);

    const { error: updateError } = await supabase
      .from('personas')
      .update({ slug: newSlug })
      .eq('id', persona.id);

    if (updateError) {
      console.error(`Failed to update slug for persona ID ${persona.id}:`, updateError);
    } else {
      console.log(`Successfully updated slug for persona ID ${persona.id}`);
    }
  }

  console.log('Finished fixing persona slugs.');
}

fixPersonaSlugs();
