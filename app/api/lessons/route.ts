import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CreateLessonRequest } from "@/types/lesson";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: lessons, error } = await supabase
      .from("lessons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching lessons:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch lessons" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, lessons });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateLessonRequest = await request.json();
    
    if (!body.outline || typeof body.outline !== "string" || !body.outline.trim()) {
      return NextResponse.json(
        { success: false, error: "Outline is required" },
        { status: 400 }
      );
    }

    const outline = body.outline.trim();
    
    // Extract a title from the outline (first 50 chars or until first sentence)
    const title = outline.length > 50 
      ? outline.substring(0, 47) + "..." 
      : outline;

    const supabase = await createClient();
    
    const { data: lesson, error } = await supabase
      .from("lessons")
      .insert({
        title,
        outline,
        status: "generating",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating lesson:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create lesson" },
        { status: 500 }
      );
    }

    // Don't trigger background generation here - let the frontend handle streaming

    return NextResponse.json({ success: true, lesson });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}