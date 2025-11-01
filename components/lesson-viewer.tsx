"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Lesson } from "@/types/lesson";
import { formatDistanceToNow } from "date-fns";
import { LessonRenderer } from "./lesson-renderer";

interface LessonViewerProps {
  lesson: Lesson;
}

export function LessonViewer({ lesson }: LessonViewerProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.push("/");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={handleGoBack} size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lessons
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{lesson.title}</h1>
          <p className="text-muted-foreground mt-1">
            Created {formatDistanceToNow(new Date(lesson.created_at))} ago
          </p>
        </div>
      </div>

      {/* Lesson Content */}
      <div className="space-y-6">
        {/* Generated Lesson Component */}
        <LessonRenderer lesson={lesson} />
        
        {/* Lesson Meta Information */}
        <Card>
          <CardHeader>
            <CardTitle>Lesson Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 text-sm">
              <div>
                <span className="font-medium">Original Outline:</span>
                <p className="mt-1 text-muted-foreground">{lesson.outline}</p>
              </div>
              <div>
                <span className="font-medium">Generated:</span>
                <p className="mt-1 text-muted-foreground">
                  {formatDistanceToNow(new Date(lesson.created_at))} ago
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}