-- Create the lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  outline TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  generated_code TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);

-- Create an index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons(created_at DESC);

-- Enable real-time for the lessons table
ALTER TABLE lessons REPLICA IDENTITY FULL;

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();