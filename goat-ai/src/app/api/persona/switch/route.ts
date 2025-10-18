import { NextRequest, NextResponse } from "next/server";
import { getPersona, buildPersona } from "@/lib/personas";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { conversationId, newPersonaSlug } = await request.json();

    if (!conversationId || !newPersonaSlug) {
      return NextResponse.json(
        { error: "conversationId and newPersonaSlug are required" },
        { status: 400 }
      );
    }

    // Validate conversation exists
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Fetch or build the new persona
    let persona = await getPersona(newPersonaSlug);
    if (!persona) {
      persona = await buildPersona(newPersonaSlug);
    }

    if (!persona) {
      return NextResponse.json(
        { error: "Persona not found or could not be created" },
        { status: 404 }
      );
    }

    // Update conversation's primary persona_id for reference
    const { error: updateError } = await supabase
      .from("conversations")
      .update({ 
        persona_id: persona.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", conversationId);

    if (updateError) {
      console.error("Error updating conversation persona:", updateError);
      // Continue even if update fails - not critical
    }

    return NextResponse.json({
      success: true,
      persona,
    });
  } catch (error) {
    console.error("Persona switch error:", error);
    return NextResponse.json(
      { error: "Failed to switch persona" },
      { status: 500 }
    );
  }
}

