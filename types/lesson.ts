export type LessonStatus = 'generating' | 'completed' | 'failed';

export type Lesson = {
  id: string;
  title: string;
  outline: string;
  status: LessonStatus;
  generated_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateLessonRequest = {
  outline: string;
};

export type LessonGenerationResponse = {
  success: boolean;
  lesson?: Lesson;
  error?: string;
};