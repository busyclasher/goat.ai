import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(request: Request) {
  try {
    // Extract the ID from the URL directly to bypass the Turbopack warning
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const conversationId = pathParts[pathParts.length - 1];

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    // 1. Fetch the conversation details
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (conversationError) {
      console.error("Error fetching conversation:", conversationError);
      return NextResponse.json(
        { error: conversationError.message },
        { status: 500 }
      );
    }

    // 2. Fetch the messages for the conversation
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return NextResponse.json(
        { error: messagesError.message },
        { status: 500 }
      );
    }

    // 3. Combine and return the result
    return NextResponse.json({
      ...conversation,
      messages: messages || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
