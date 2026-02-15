-- FranPadelProject Exercise Progress Tracking Migration
-- Add table for tracking exercise completions

-- Exercise progress tracking table
CREATE TABLE exercise_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_external_id TEXT NOT NULL, -- References Contentful exercise externalId
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exercise_external_id)
);

-- Create indexes for better performance
CREATE INDEX idx_exercise_progress_user_id ON exercise_progress(user_id);
CREATE INDEX idx_exercise_progress_exercise_external_id ON exercise_progress(exercise_external_id);
CREATE INDEX idx_exercise_progress_user_exercise ON exercise_progress(user_id, exercise_external_id);
CREATE INDEX idx_exercise_progress_completed_at ON exercise_progress(completed_at);

-- Add updated_at trigger
CREATE TRIGGER update_exercise_progress_updated_at BEFORE UPDATE ON exercise_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercise_progress
CREATE POLICY "Users can view their own exercise progress" ON exercise_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercise progress" ON exercise_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise progress" ON exercise_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all exercise progress" ON exercise_progress
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage all exercise progress" ON exercise_progress
  FOR ALL USING (is_admin());

-- Add comments for documentation
COMMENT ON TABLE exercise_progress IS 'Tracks user completion of exercises';
COMMENT ON COLUMN exercise_progress.exercise_external_id IS 'Contentful exercise externalId';
COMMENT ON COLUMN exercise_progress.completed_at IS 'Timestamp when the exercise was marked as complete';
