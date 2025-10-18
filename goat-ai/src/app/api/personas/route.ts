import { NextResponse } from "next/server";
import { listPersonas } from "@/lib/personas";

export async function GET() {
  try {
    const personas = await listPersonas();

    return NextResponse.json({
      success: true,
      personas: personas,
    });
  } catch (error) {
    console.error("Error fetching personas:", error);
    return NextResponse.json(
      { error: "Failed to fetch personas" },
      { status: 500 }
    );
  }
}
