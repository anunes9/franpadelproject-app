-- FranPadelProject Weekly Planning - Add Exercise Support
-- Extend weekly planning to support both modules and exercises

-- Create item type enum
CREATE TYPE weekly_plan_item_type AS ENUM ('module', 'exercise');

-- Add item_type column with default value 'module' for existing records
ALTER TABLE weekly_plan_modules
ADD COLUMN item_type weekly_plan_item_type NOT NULL DEFAULT 'module';

-- Rename module_external_id to item_external_id for clarity
ALTER TABLE weekly_plan_modules
RENAME COLUMN module_external_id TO item_external_id;

-- Update the index on item_external_id
DROP INDEX IF EXISTS idx_weekly_plan_modules_module_external_id;
CREATE INDEX idx_weekly_plan_modules_item_external_id ON weekly_plan_modules(item_external_id);

-- Add index on item_type for filtering
CREATE INDEX idx_weekly_plan_modules_item_type ON weekly_plan_modules(item_type);

-- Add composite index for common queries
CREATE INDEX idx_weekly_plan_modules_plan_type ON weekly_plan_modules(weekly_plan_id, item_type);

-- Add comments for documentation
COMMENT ON COLUMN weekly_plan_modules.item_type IS 'Type of item: module or exercise';
COMMENT ON COLUMN weekly_plan_modules.item_external_id IS 'References externalId field in Contentful (modules or exercises content type)';

