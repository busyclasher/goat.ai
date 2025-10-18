import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(req: Request) {
  try {
    const { personaId, userId, title } = await req.json();

    if (!personaId) {
      return NextResponse.json(
        { error: "personaId is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("conversations")
      .insert([{ persona_id: personaId, user_id: userId, title }])
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation in API route:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
