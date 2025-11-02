"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Lesson } from "@/types/lesson";
import * as React from "react";
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';

interface LessonRendererProps {
  lesson: Lesson;
}

export function LessonRenderer({ lesson }: LessonRendererProps) {
  if (!lesson.generated_code) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">{lesson.title}</h1>
        <Card>
          <CardHeader>
            <CardTitle>Interactive Lesson</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-lg">
                Welcome to this interactive lesson on: <strong>{lesson.outline}</strong>
              </p>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">Lesson Content</h3>
                <p>This lesson covers the fundamentals and provides interactive examples to help you understand the topic better.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Start Learning
                </Button>
                <Button variant="outline">
                  Practice Exercises
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="grid gap-6">
        {/* Live Interactive Lesson */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive React Component</CardTitle>
          </CardHeader>
          <CardContent>
            <LiveProvider 
              code={lesson.generated_code}
              scope={{ 
                useState: React.useState, 
                useEffect: React.useEffect,
                React
              }}
              noInline={true}
            >
              <div className="border rounded-lg overflow-hidden">
                <LivePreview className="p-4 bg-gray-50 border-b" />
                <LiveError className="p-4 bg-red-50 text-red-800 text-sm" />
              </div>
              
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold bg-gray-100 p-3 rounded-lg hover:bg-gray-200">
                  📝 View & Edit Generated Code
                </summary>
                <div className="mt-2">
                  <LiveEditor 
                    className="rounded-lg overflow-hidden" 
                    style={{
                      fontFamily: 'Monaco, Menlo, monospace',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </details>
            </LiveProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}