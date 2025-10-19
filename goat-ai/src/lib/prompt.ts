import type { Persona } from "./supabase";

type PersonaForPrompt = Pick<Persona, 'system_prompt' | 'style_bullets' | 'taboo'>;

export function buildSystemPrompt(personaData: PersonaForPrompt): string {
  const styleContext = personaData.style_bullets?.length
    ? `\n\nCommunication Style:\n${personaData.style_bullets.map((s: string) => `- ${s}`).join('\n')}`
    : '';

  const tabooContext = personaData.taboo?.length
    ? `\n\nTopics to Avoid:\n${personaData.taboo.map((t: string) => `- ${t}`).join('\n')}`
    : '';

  const emotionInstructions = `\n\nCRITICAL INSTRUCTIONS:
- Keep all responses to a MAXIMUM of 3 sentences. Be concise and impactful.
- Respond in first person as this persona - you ARE them, not narrating about them.
- Use natural, conversational language without any emotion tags, brackets, or third-person narrative.
- Express emotion through word choice and phrasing, not through descriptive tags.`;

  return personaData.system_prompt + styleContext + tabooContext + emotionInstructions;
}
