-- FranPadelProject Weekly Planning Migration
-- Add tables for user weekly planning system

-- Create weekly_plans table to store user's weekly planning metadata
CREATE TABLE weekly_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL, -- ISO week number (1-53)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year, week_number)
);

-- Create weekly_plan_modules junction table to link modules to specific days
CREATE TABLE weekly_plan_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  weekly_plan_id UUID NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  module_external_id TEXT NOT NULL, -- References Contentful module externalId
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7), -- 1=Monday, 7=Sunday
  order_index INTEGER NOT NULL DEFAULT 0, -- For multiple modules per day
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_weekly_plans_user_id ON weekly_plans(user_id);
CREATE INDEX idx_weekly_plans_year_week ON weekly_plans(year, week_number);
CREATE INDEX idx_weekly_plans_user_year_week ON weekly_plans(user_id, year, week_number);

CREATE INDEX idx_weekly_plan_modules_weekly_plan_id ON weekly_plan_modules(weekly_plan_id);
CREATE INDEX idx_weekly_plan_modules_module_external_id ON weekly_plan_modules(module_external_id);
CREATE INDEX idx_weekly_plan_modules_day_of_week ON weekly_plan_modules(day_of_week);
CREATE INDEX idx_weekly_plan_modules_weekly_plan_day ON weekly_plan_modules(weekly_plan_id, day_of_week);

-- Add updated_at triggers
CREATE TRIGGER update_weekly_plans_updated_at BEFORE UPDATE ON weekly_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_plan_modules_updated_at BEFORE UPDATE ON weekly_plan_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plan_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_plans
CREATE POLICY "Users can view their own weekly plans" ON weekly_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly plans" ON weekly_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly plans" ON weekly_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly plans" ON weekly_plans
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all weekly plans" ON weekly_plans
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage all weekly plans" ON weekly_plans
  FOR ALL USING (is_admin());

-- RLS Policies for weekly_plan_modules
-- Users can only access modules in their own weekly plans
CREATE POLICY "Users can view their own weekly plan modules" ON weekly_plan_modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weekly_plans
      WHERE weekly_plans.id = weekly_plan_modules.weekly_plan_id
      AND weekly_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert modules to their own weekly plans" ON weekly_plan_modules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM weekly_plans
      WHERE weekly_plans.id = weekly_plan_modules.weekly_plan_id
      AND weekly_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update modules in their own weekly plans" ON weekly_plan_modules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM weekly_plans
      WHERE weekly_plans.id = weekly_plan_modules.weekly_plan_id
      AND weekly_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete modules from their own weekly plans" ON weekly_plan_modules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM weekly_plans
      WHERE weekly_plans.id = weekly_plan_modules.weekly_plan_id
      AND weekly_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all weekly plan modules" ON weekly_plan_modules
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage all weekly plan modules" ON weekly_plan_modules
  FOR ALL USING (is_admin());

-- Add comments for documentation
COMMENT ON TABLE weekly_plans IS 'Stores user weekly planning metadata with year and ISO week number';
COMMENT ON TABLE weekly_plan_modules IS 'Junction table linking Contentful modules to specific days in weekly plans';
COMMENT ON COLUMN weekly_plans.week_number IS 'ISO week number (1-53) following ISO 8601 standard';
COMMENT ON COLUMN weekly_plan_modules.day_of_week IS 'Day of week: 1=Monday, 2=Tuesday, ..., 7=Sunday (ISO 8601)';
COMMENT ON COLUMN weekly_plan_modules.order_index IS 'Order of module when multiple modules are assigned to the same day';
COMMENT ON COLUMN weekly_plan_modules.module_external_id IS 'References externalId field in Contentful modules content type';

