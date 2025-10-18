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
      .select("id, system_prompt")
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

    // 2. Use activePersona.system_prompt as LLM system message and compose Groq prompt.
    const groqResponse = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: activePersona.system_prompt,
        },
        {
          role: "user",
          content: text,
        },
      ],
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
