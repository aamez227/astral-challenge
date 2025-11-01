import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateLessonCodeStream } from "@/lib/ai/lesson-generator";

export async function POST(request: NextRequest) {
  try {
    const { lessonId } = await request.json();
    
    console.log("Streaming request for lesson:", lessonId);
    
    if (!lessonId) {
      console.error("No lesson ID provided");
      return new Response("Lesson ID is required", { status: 400 });
    }

    const supabase = await createClient();
    
    // Get the lesson details
    const { data: lesson, error: fetchError } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .single();

    if (fetchError || !lesson) {
      return new Response("Lesson not found", { status: 404 });
    }

    // Allow streaming for lessons in any state except failed
    if (lesson.status === "failed") {
      return new Response("Cannot regenerate failed lesson", { status: 400 });
    }

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          controller.enqueue(`data: ${JSON.stringify({ 
            type: "status", 
            message: "Starting lesson generation..." 
          })}\n\n`);

          let fullCode = "";
          
          // Stream the generation process
          for await (const chunk of generateLessonCodeStream(lesson.outline)) {
            fullCode += chunk.content;
            
            // Send the chunk to the client
            controller.enqueue(`data: ${JSON.stringify({
              type: "chunk",
              content: chunk.content,
              progress: chunk.progress,
              stage: chunk.stage
            })}\n\n`);
          }

          // Update the lesson in the database
          const { error: updateError } = await supabase
            .from("lessons")
            .update({
              status: "completed",
              generated_code: fullCode,
              error_message: null,
            })
            .eq("id", lessonId);

          if (updateError) {
            throw new Error("Failed to update lesson");
          }

          // Send completion signal
          controller.enqueue(`data: ${JSON.stringify({ 
            type: "complete", 
            message: "Lesson generation completed!" 
          })}\n\n`);

        } catch (error) {
          console.error("Streaming error:", error);
          
          // Update lesson with error status
          await supabase
            .from("lessons")
            .update({
              status: "failed",
              error_message: error instanceof Error ? error.message : "Generation failed",
            })
            .eq("id", lessonId);

          // Send error to client
          controller.enqueue(`data: ${JSON.stringify({ 
            type: "error", 
            message: error instanceof Error ? error.message : "Generation failed" 
          })}\n\n`);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Stream setup error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}