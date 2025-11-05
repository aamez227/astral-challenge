"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LessonViewer } from "@/components/lesson-viewer";
import { Lesson } from "@/types/lesson";
import { Loader2 } from "lucide-react";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();
  const lessonId = params.id as string;

  useEffect(() => {
    if (!lessonId) return;

    // Initial fetch
    const fetchLesson = async () => {
      try {
        const { data, error } = await supabase
          .from("lessons")
          .select("*")
          .eq("id", lessonId)
          .single();

        if (error) {
          console.error("Lesson fetch error:", error);
          setError("Lesson not found");
          return;
        }

        setLesson(data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Failed to load lesson");
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();

    // Set up real-time subscription
    const channel = supabase
      .channel(`lesson_${lessonId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "lessons",
          filter: `id=eq.${lessonId}`,
        },
        (payload) => {
          setLesson(payload.new as Lesson);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lessonId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Lesson Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error || "This lesson could not be found."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Lessons
          </button>
        </div>
      </div>
    );
  }

  if (lesson.status === "generating") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center mb-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h1 className="text-2xl font-bold mb-2">Generating Your Lesson</h1>
            <p className="text-gray-600">{lesson.title}</p>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AI is creating your interactive lesson...</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 text-center">
              This page will automatically update when your lesson is ready.
            </p>
            
            <button
              onClick={() => router.push("/")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Lessons
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (lesson.status === "failed") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Generation Failed</h1>
          <p className="text-muted-foreground mb-4">
            {lesson.error_message || "The lesson failed to generate. Please try again."}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => router.push("/")}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Lessons
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (lesson.status !== "completed" || !lesson.generated_code) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Lesson Not Ready</h1>
          <p className="text-muted-foreground">
            This lesson is in an unknown state. Status: {lesson.status}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LessonViewer lesson={lesson} />
    </div>
  );
}