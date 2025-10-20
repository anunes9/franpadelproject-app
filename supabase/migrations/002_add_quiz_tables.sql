-- FranPadelProject Quiz System Migration
-- Add tables for quiz responses and user progress tracking

-- Create custom types for quiz system
CREATE TYPE module_status AS ENUM ('not_started', 'in_progress', 'completed');

-- Quiz attempts table (stores quiz submissions with JSONB responses)
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_external_id TEXT NOT NULL, -- References Contentful module externalId
  attempt_number INTEGER NOT NULL DEFAULT 1,
  responses JSONB NOT NULL, -- Store all responses as JSON
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  score_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER, -- Optional: track time spent on quiz
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_external_id, attempt_number)
);

-- Module progress tracking table
CREATE TABLE module_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_external_id TEXT NOT NULL,
  status module_status NOT NULL DEFAULT 'not_started',
  best_score DECIMAL(5,2), -- Best score achieved across all attempts
  total_attempts INTEGER NOT NULL DEFAULT 0,
  first_attempt_at TIMESTAMP WITH TIME ZONE,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_external_id)
);

-- Create indexes for better performance
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_module_external_id ON quiz_attempts(module_external_id);
CREATE INDEX idx_quiz_attempts_user_module ON quiz_attempts(user_id, module_external_id);
CREATE INDEX idx_quiz_attempts_completed_at ON quiz_attempts(completed_at);
CREATE INDEX idx_quiz_attempts_responses_gin ON quiz_attempts USING GIN (responses);

CREATE INDEX idx_module_progress_user_id ON module_progress(user_id);
CREATE INDEX idx_module_progress_module_external_id ON module_progress(module_external_id);
CREATE INDEX idx_module_progress_status ON module_progress(status);
CREATE INDEX idx_module_progress_user_module ON module_progress(user_id, module_external_id);

-- Add updated_at triggers
CREATE TRIGGER update_quiz_attempts_updated_at BEFORE UPDATE ON quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_progress_updated_at BEFORE UPDATE ON module_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz_attempts
CREATE POLICY "Users can view their own quiz attempts" ON quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz attempts" ON quiz_attempts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts" ON quiz_attempts
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage all quiz attempts" ON quiz_attempts
  FOR ALL USING (is_admin());

-- RLS Policies for module_progress
CREATE POLICY "Users can view their own module progress" ON module_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own module progress" ON module_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own module progress" ON module_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all module progress" ON module_progress
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage all module progress" ON module_progress
  FOR ALL USING (is_admin());

-- Function to automatically update module progress when quiz is completed
CREATE OR REPLACE FUNCTION update_module_progress_on_quiz_completion()
RETURNS TRIGGER AS $$
DECLARE
  current_best_score DECIMAL(5,2);
  current_status module_status;
BEGIN
  -- Get current best score and status
  SELECT best_score, status INTO current_best_score, current_status
  FROM module_progress
  WHERE user_id = NEW.user_id AND module_external_id = NEW.module_external_id;

  -- Insert or update module progress
  INSERT INTO module_progress (
    user_id,
    module_external_id,
    status,
    best_score,
    total_attempts,
    first_attempt_at,
    last_attempt_at,
    completed_at
  ) VALUES (
    NEW.user_id,
    NEW.module_external_id,
    CASE
      WHEN NEW.score_percentage >= 70 THEN 'completed'::module_status
      ELSE 'in_progress'::module_status
    END,
    NEW.score_percentage,
    1,
    NEW.completed_at,
    NEW.completed_at,
    CASE
      WHEN NEW.score_percentage >= 70 THEN NEW.completed_at
      ELSE NULL
    END
  )
  ON CONFLICT (user_id, module_external_id) DO UPDATE SET
    status = CASE
      WHEN NEW.score_percentage >= 70 THEN 'completed'::module_status
      WHEN current_status = 'completed' THEN 'completed'::module_status
      ELSE 'in_progress'::module_status
    END,
    best_score = GREATEST(COALESCE(current_best_score, 0), NEW.score_percentage),
    total_attempts = module_progress.total_attempts + 1,
    last_attempt_at = NEW.completed_at,
    completed_at = CASE
      WHEN NEW.score_percentage >= 70 AND module_progress.completed_at IS NULL THEN NEW.completed_at
      ELSE module_progress.completed_at
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update module progress when quiz is completed
CREATE TRIGGER trigger_update_module_progress
  AFTER INSERT ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_module_progress_on_quiz_completion();

-- Add comments for documentation
COMMENT ON TABLE quiz_attempts IS 'Stores quiz attempts with responses in JSONB format';
COMMENT ON TABLE module_progress IS 'Tracks user progress through modules';
COMMENT ON COLUMN quiz_attempts.responses IS 'JSONB object containing all question responses: {"questionId": {"selectedIndex": 0, "selectedText": "...", "isCorrect": true}}';
COMMENT ON COLUMN quiz_attempts.score_percentage IS 'Percentage score (0-100) for this attempt';
COMMENT ON COLUMN module_progress.best_score IS 'Best score achieved across all attempts for this module';
COMMENT ON COLUMN module_progress.status IS 'Current status: not_started, in_progress, or completed (70%+ score)';
