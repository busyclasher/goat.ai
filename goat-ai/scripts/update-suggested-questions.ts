import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Persona-specific suggested questions
const suggestedQuestions = {
  warrenbuffett: [
    "What makes a company worth investing in long-term?",
    "How do you think about risk in business decisions?",
    "What's your advice for young people starting their careers?",
    "How do you maintain your 'inner scorecard'?"
  ],
  elonmusk: [
    "What's your vision for making humanity multiplanetary?",
    "How do you approach solving impossible problems?",
    "What role will AI play in our future?",
    "How do you stay innovative in traditional industries?"
  ],
  'jeff-bezos': [
    "What does 'customer obsession' really mean?",
    "How do you think about long-term thinking in business?",
    "What's your approach to innovation and risk-taking?",
    "How do you build a culture of high standards?"
  ]
}

async function updateSuggestedQuestions() {
  console.log('🚀 Starting to update suggested questions...\n')

  for (const [slug, questions] of Object.entries(suggestedQuestions)) {
    try {
      // Check if persona exists
      const { data: persona, error: fetchError } = await supabase
        .from('personas')
        .select('id, slug, name')
        .eq('slug', slug)
        .single()

      if (fetchError || !persona) {
        console.log(`⚠️  Persona "${slug}" not found, skipping...`)
        continue
      }

      // Update suggested questions
      const { error: updateError } = await supabase
        .from('personas')
        .update({ suggested_questions: questions })
        .eq('slug', slug)

      if (updateError) {
        console.error(`❌ Error updating ${persona.name}:`, updateError.message)
      } else {
        console.log(`✅ Updated ${persona.name} (${slug})`)
        console.log(`   Questions:`)
        questions.forEach((q, i) => console.log(`   ${i + 1}. ${q}`))
        console.log()
      }
    } catch (error) {
      console.error(`❌ Error processing ${slug}:`, error)
    }
  }

  console.log('✨ Suggested questions update complete!')
}

updateSuggestedQuestions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

