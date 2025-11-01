import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateLessonCode } from "@/lib/ai/lesson-generator";
import { validateTypeScriptCode } from "@/lib/ai/code-validator";

export async function POST(request: NextRequest) {
  try {
    const { lessonId } = await request.json();
    
    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: "Lesson ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get the lesson details
    const { data: lesson, error: fetchError } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .single();

    if (fetchError || !lesson) {
      console.error("Error fetching lesson:", fetchError);
      return NextResponse.json(
        { success: false, error: "Lesson not found" },
        { status: 404 }
      );
    }

    if (lesson.status !== "generating") {
      return NextResponse.json(
        { success: false, error: "Lesson is not in generating state" },
        { status: 400 }
      );
    }

    try {
      // Generate the lesson code using AI
      const generatedCode = await generateLessonCode(lesson.outline);
      
      // Validate the generated TypeScript code
      const validationResult = await validateTypeScriptCode(generatedCode);
      
      if (!validationResult.isValid) {
        console.error("Generated code validation failed:", validationResult.errors);
        
        // Update lesson with failure status
        await supabase
          .from("lessons")
          .update({
            status: "failed",
            error_message: `Code validation failed: ${validationResult.errors.join(", ")}`,
          })
          .eq("id", lessonId);

        return NextResponse.json({
          success: false,
          error: "Generated code validation failed",
        });
      }

      // Update lesson with generated code
      const { error: updateError } = await supabase
        .from("lessons")
        .update({
          status: "completed",
          generated_code: generatedCode,
          error_message: null,
        })
        .eq("id", lessonId);

      if (updateError) {
        console.error("Error updating lesson:", updateError);
        return NextResponse.json(
          { success: false, error: "Failed to update lesson" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (generationError) {
      console.error("Error generating lesson:", generationError);
      
      // Update lesson with failure status
      await supabase
        .from("lessons")
        .update({
          status: "failed",
          error_message: generationError instanceof Error 
            ? generationError.message 
            : "Unknown generation error",
        })
        .eq("id", lessonId);

      return NextResponse.json(
        { success: false, error: "Failed to generate lesson" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}