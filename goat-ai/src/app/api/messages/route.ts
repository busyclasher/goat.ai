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

    // 1. Insert the new message with optional persona_id
    const messageData: {
      conversation_id: string;
      role: string;
      content: string;
      audio_url?: string;
      persona_id?: string;
    } = {
      conversation_id: conversationId,
      role,
      content, // Database schema uses 'content' column
      audio_url: audioUrl,
    };

    // Only add persona_id if provided (typically for assistant messages)
    if (personaId) {
      messageData.persona_id = personaId;
    }

    const { error: messageError } = await supabase.from("messages").insert(messageData);

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

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
