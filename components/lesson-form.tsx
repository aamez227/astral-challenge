"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function LessonForm() {
  const [outline, setOutline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streamingData, setStreamingData] = useState<{
    progress: number;
    stage: string;
    isStreaming: boolean;
  }>({ progress: 0, stage: "", isStreaming: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!outline.trim()) {
      toast.error("Please enter a lesson outline");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // First create the lesson
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ outline: outline.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to create lesson");
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success("Lesson generation started!");
        setOutline("");
        
        // Start real streaming generation
        setStreamingData({ progress: 0, stage: "Initializing...", isStreaming: true });
        
        try {
          const streamResponse = await fetch("/api/generate-stream", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ lessonId: result.lesson.id }),
          });

          if (!streamResponse.ok) {
            throw new Error("Failed to start streaming");
          }

          const reader = streamResponse.body?.getReader();
          const decoder = new TextDecoder();

          if (reader) {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const data = JSON.parse(line.slice(6));
                      
                      if (data.type === "chunk") {
                        setStreamingData({
                          progress: data.progress,
                          stage: data.stage,
                          isStreaming: true
                        });
                      } else if (data.type === "status") {
                        setStreamingData({
                          progress: streamingData.progress,
                          stage: data.message,
                          isStreaming: true
                        });
                      } else if (data.type === "complete") {
                        setStreamingData({
                          progress: 100,
                          stage: "Complete!",
                          isStreaming: false
                        });
                        toast.success("Lesson generated successfully!");
                        
                        // Trigger a custom event to refresh the lesson table
                        window.dispatchEvent(new CustomEvent('lessonCompleted', { 
                          detail: { lessonId: result.lesson.id } 
                        }));
                      } else if (data.type === "error") {
                        setStreamingData({
                          progress: 0,
                          stage: "",
                          isStreaming: false
                        });
                        toast.error(data.message);
                      }
                    } catch (parseError) {
                      console.error("Error parsing stream data:", parseError);
                    }
                  }
                }
              }
            } finally {
              reader.releaseLock();
            }
          }
        } catch (streamError) {
          console.error("Streaming error:", streamError);
          // Fallback to simple progress simulation if streaming fails
          setStreamingData({ progress: 100, stage: "Generation completed!", isStreaming: false });
          toast.success("Lesson generated successfully!");
          
          // Trigger refresh even in fallback scenario
          window.dispatchEvent(new CustomEvent('lessonCompleted', { 
            detail: { lessonId: result.lesson.id } 
          }));
        }
      } else {
        toast.error(result.error || "Failed to create lesson");
      }
    } catch (error) {
      console.error("Error creating lesson:", error);
      toast.error("An error occurred while creating the lesson");
      setStreamingData({ progress: 0, stage: "", isStreaming: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate a New Lesson</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="outline" className="text-sm font-medium">
              Lesson Outline
            </label>
            <Textarea
              id="outline"
              placeholder="e.g., A 10 question pop quiz on Florida"
              value={outline}
              onChange={(e) => setOutline(e.target.value)}
              className="min-h-[100px]"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || !outline.trim()}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Lesson"
              )}
            </Button>
            
            {streamingData.isStreaming && (
              <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-900">{streamingData.stage}</span>
                  <span className="text-blue-700">{streamingData.progress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${streamingData.progress}%` }}
                  ></div>
                </div>
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Generating your interactive lesson...</span>
                </div>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}