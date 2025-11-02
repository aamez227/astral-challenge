import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const lessonId = resolvedParams.id;
    
    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: "Lesson ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    const { data: existingLesson, error: fetchError } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", lessonId)
      .single();

    if (fetchError || !existingLesson) {
      return NextResponse.json(
        { success: false, error: "Lesson not found" },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from("lessons")
      .delete()
      .eq("id", lessonId);

    if (deleteError) {
      console.error("Error deleting lesson:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete lesson" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Lesson deleted successfully" 
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;
    
    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: "Lesson ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    const { data: lesson, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .single();

    if (error || !lesson) {
      return NextResponse.json(
        { success: false, error: "Lesson not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, lesson });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}