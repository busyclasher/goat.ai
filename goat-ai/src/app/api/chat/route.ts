import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { groq } from "../../../lib/groq";

export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return NextResponse.json({ text: "Demo response" });
  }

  const { conversationId, text } = await req.json();

  if (!conversationId || !text) {
    return NextResponse.json(
      { text: "Missing conversationId or text" },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch activePersona from Supabase for this conversation.
    const { data: conversationData, error: conversationError } = await supabase
      .from("conversations")
      .select("persona_id")
      .eq("id", conversationId)
      .single();

    if (conversationError) throw conversationError;

    if (!conversationData) {
      return NextResponse.json(
        { text: "Conversation not found" },
        { status: 404 }
      );
    }

    const personaId = conversationData.persona_id;
    const { data: personaData, error: personaError } = await supabase
      .from("personas")
      .select("id, system_prompt, style_bullets, taboo")
      .eq("id", personaId)
      .single();

    if (personaError) throw personaError;

    if (!personaData) {
      return NextResponse.json(
        { text: "Persona not found for this conversation" },
        { status: 404 }
      );
    }

    const activePersona = personaData;

    // 2. Fetch conversation history from messages table
    const { data: messageHistory, error: messagesError } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;

    // 3. Build messages array: system prompt + history
    // Note: The current user message is already saved in DB and included in messageHistory
    
    // Build enhanced system prompt with style bullets and taboo
    const styleContext = personaData.style_bullets?.length 
      ? `\n\nCommunication Style:\n${personaData.style_bullets.map((s: string) => `- ${s}`).join('\n')}`
      : '';

    const tabooContext = personaData.taboo?.length
      ? `\n\nTopics to Avoid:\n${personaData.taboo.map((t: string) => `- ${t}`).join('\n')}`
      : '';

    const emotionInstructions = `\n\nIMPORTANT: Use emotion/delivery tags like [sarcastically], [giggles], [whispers], [excitedly], [thoughtfully], [chuckles], [softly] etc. throughout your responses to indicate how you're saying things. Place them naturally where vocal inflection would occur.`;

    const messages = [
      {
        role: "system" as const,
        content: activePersona.system_prompt + styleContext + tabooContext + emotionInstructions,
      },
      // Add conversation history (includes the current user message)
      ...(messageHistory || []).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    // 4. Call Groq with full conversation context
    const groqResponse = await groq.chat.completions.create({
      messages,
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.7,
      max_tokens: 500,
    });

    const assistantText = groqResponse.choices[0].message.content;

    // 3. On response, insert new message into messages (SKIPPED FOR TESTING)
    // const { error: insertError } = await supabase.from("messages").insert({
    //   role: "assistant",
    //   persona_id: activePersona.id,
    //   text: assistantText,
    //   timestamp: new Date().toISOString(),
    //   conversation_id: conversationId,
    // });

    // if (insertError) throw insertError;

    // 4. Return { text }
    return NextResponse.json({ text: assistantText });
  } catch (error) {
    console.error("Caught error in /api/chat route:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { text: "Let's circle back to that later.", error: errorMessage },
      { status: 500 }
    );
  }
}
