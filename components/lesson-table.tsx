"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, AlertCircle, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Lesson, LessonStatus } from "@/types/lesson";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export function LessonTable() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching lessons:", error);
        return;
      }

      setLessons(data || []);
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();

    const subscription = supabase
      .channel("lessons")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lessons",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setLessons((prev) => [payload.new as Lesson, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setLessons((prev) =>
              prev.map((lesson) =>
                lesson.id === payload.new.id ? (payload.new as Lesson) : lesson
              )
            );
          } else if (payload.eventType === "DELETE") {
            setLessons((prev) =>
              prev.filter((lesson) => lesson.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Listen for custom lesson completion events
    const handleLessonCompleted = (event: CustomEvent) => {
      console.log("Lesson completed event received:", event.detail);
      // Refetch lessons to ensure we have the latest data
      fetchLessons();
    };

    window.addEventListener('lessonCompleted', handleLessonCompleted as EventListener);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('lessonCompleted', handleLessonCompleted as EventListener);
    };
  }, [supabase]);

  const getStatusBadge = (status: LessonStatus) => {
    switch (status) {
      case "generating":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Generating
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="default" className="bg-green-600">
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
    }
  };

  const handleViewLesson = (lesson: Lesson) => {
    if (lesson.status === "completed") {
      router.push(`/lessons/${lesson.id}`);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson? This action cannot be undone.")) {
      return;
    }

    setDeletingId(lessonId);
    
    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Lesson deleted successfully");
        fetchLessons();
      } else {
        toast.error(result.error || "Failed to delete lesson");
      }
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast.error("An error occurred while deleting the lesson");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading lessons...</span>
        </CardContent>
      </Card>
    );
  }

  if (lessons.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            No lessons generated yet. Create your first lesson above!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Lessons</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{lesson.title}</h3>
                  {getStatusBadge(lesson.status)}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {lesson.outline}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {formatDistanceToNow(new Date(lesson.created_at))} ago
                </p>
                {lesson.error_message && (
                  <p className="text-xs text-red-600">
                    Error: {lesson.error_message}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewLesson(lesson)}
                  disabled={lesson.status !== "completed"}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteLesson(lesson.id)}
                  disabled={deletingId === lesson.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  {deletingId === lesson.id ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1 h-4 w-4" />
                  )}
                  {deletingId === lesson.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}