-- Add date column to weekly_plan_modules for specific date tracking
-- This allows items to be linked to specific dates rather than just day of week

-- Add date column
ALTER TABLE weekly_plan_modules
ADD COLUMN date DATE;

-- Create index on date for better query performance
CREATE INDEX idx_weekly_plan_modules_date ON weekly_plan_modules(date);

-- Create composite index for common queries
CREATE INDEX idx_weekly_plan_modules_plan_date ON weekly_plan_modules(weekly_plan_id, date);

-- Add comment for documentation
COMMENT ON COLUMN weekly_plan_modules.date IS 'Specific date for this item (YYYY-MM-DD). Allows items to be linked to exact dates rather than just day of week.';
