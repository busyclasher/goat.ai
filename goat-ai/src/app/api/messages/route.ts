import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(req: Request) {
  try {
    const { conversationId, role, content, audioUrl, personaId } = await req.json();

    if (!conversationId || !role || !content) {
      return NextResponse.json(
        { error: "conversationId, role, and content are required" },
        { status: 400 }
      );
    }

    const messageToInsert: any = {
      conversation_id: conversationId,
      role,
      content,
      text: content, // Ensure text is populated for legacy schema
      audio_url: audioUrl,
    };

    if (role === 'assistant' && personaId) {
      messageToInsert.persona_id = personaId;
    }

    // 1. Insert the new message
    const { data: newMessage, error: messageError } = await supabase
      .from("messages")
      .insert(messageToInsert)
      .select(`*, persona:personas(*)`)
      .single();

    if (messageError) {
      console.error("Error inserting message:", messageError);
      return NextResponse.json(
        { error: messageError.message },
        { status: 500 }
      );
    }

    // 2. Update the conversation's updated_at timestamp
    const { error: conversationError } = await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    if (conversationError) {
      // Log this error but don't fail the request, as the message was still saved.
      console.warn("Could not update conversation timestamp:", conversationError);
    }

    return NextResponse.json(newMessage);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
