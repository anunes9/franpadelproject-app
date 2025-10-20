# Exercise Support in Weekly Planning - Implementation Summary

## Overview

Successfully extended the Weekly Planning feature to support adding both Modules and Exercises to each day. Users can now select from both content types using a unified selector with tabs, and day cards display them in separate sections.

## Changes Made

### 1. Database Layer ✅

**Migration File**: `supabase/migrations/004_add_exercises_to_weekly_planning.sql`

- Created `weekly_plan_item_type` ENUM ('module', 'exercise')
- Added `item_type` column to `weekly_plan_modules` table with default 'module'
- Renamed `module_external_id` to `item_external_id` for clarity
- Updated indexes for better query performance
- Added composite indexes for filtering by type

**Database Types**: `src/lib/database/types.ts`

- Added `WeeklyPlanItemType` type ('module' | 'exercise')
- Updated `weekly_plan_modules` interface with:
  - `item_external_id` (renamed from `module_external_id`)
  - `item_type` field of type `WeeklyPlanItemType`

### 2. Server Actions ✅

**File**: `src/app/dashboard/weekly-planning/actions.ts`

**Updated Interfaces:**

- `WeeklyPlanModule` → `WeeklyPlanItem` with:
  - `item_external_id` and `item_type` fields
  - Both `module?` and `exercise?` optional populated fields
- `WeeklyPlanData.modules` → `WeeklyPlanData.items`

**Updated Functions:**

- `getWeeklyPlan()` - Fetches both modules and exercises from Contentful in parallel, populates based on item type
- `addModuleToDay()` → `addItemToDay()` - Now accepts `itemType` parameter
- `removeModuleFromDay()` → `removeItemFromDay()` - Works with any item type
- `updateModuleOrder()` → `updateItemOrder()` - Works with any item type
- **New**: `getAvailableExercises()` - Fetches all exercises from Contentful

### 3. API Routes ✅

**Updated**: `src/app/api/weekly-planning/route.ts` (POST)

- Accepts `itemExternalId` and `itemType` instead of `moduleExternalId`
- Validates item type ('module' or 'exercise')
- Inserts with correct type field

**No changes needed**: Other routes work with IDs and don't require modification

### 4. UI Components ✅

**New Component**: `src/components/training-planner/item-selector.tsx`

- Replaced `module-selector.tsx`
- Tabs to switch between "Módulos" and "Exercícios"
- Search functionality for both types
- Level filters (for modules only)
- Different display for exercises (shows media icon if available)
- Returns both `itemExternalId` and `itemType` on selection

**Updated**: `src/components/training-planner/day-card.tsx`

- Groups items by type (`item_type` field)
- Displays two separate sections:
  - **MÓDULOS** section with level badges and duration
  - **EXERCÍCIOS** section with media icons
- Single "Adicionar" button opens item selector
- Empty state when no items scheduled

**Updated**: `src/components/training-planner/weekly-planning-calendar.tsx`

- Accepts both `availableModules` and `availableExercises` props
- Uses `ItemSelector` instead of `ModuleSelector`
- Handles `addItemToDay()` with item type parameter
- Groups items by day correctly

**Updated**: `src/app/dashboard/weekly-planning/page.tsx`

- Fetches exercises in parallel with modules and plan data
- Passes exercises to calendar component

**Deleted**: `src/components/training-planner/module-selector.tsx`

- Replaced by `item-selector.tsx`

## Features

### User Experience

- ✅ Unified selector with tabs for Modules and Exercises
- ✅ Separate sections in day cards for visual clarity
- ✅ Search and filter functionality for both types
- ✅ Visual distinction with icons (BookOpen for modules, Dumbbell for exercises)
- ✅ Exercises show media badge if available
- ✅ Backward compatible with existing module data

### Technical Features

- ✅ Type-safe with TypeScript enums
- ✅ Efficient database queries with proper indexes
- ✅ Parallel fetching of modules and exercises
- ✅ Clean separation of concerns
- ✅ Maintains all existing functionality

## Database Schema Updates

### weekly_plan_modules (extended)

```sql
- id: UUID
- weekly_plan_id: UUID
- item_external_id: TEXT (renamed from module_external_id)
- item_type: weekly_plan_item_type ('module' | 'exercise') -- NEW
- day_of_week: INTEGER (1-7)
- order_index: INTEGER
- notes: TEXT
- created_at, updated_at: TIMESTAMP
```

## Next Steps

### Required: Run Migration

**Important**: You need to run the database migration before using the new features:

```bash
# If using Supabase locally
supabase migration up

# Or if using Supabase remote
# Run through Supabase dashboard or CLI
```

The migration is backward compatible:

- Existing data will have `item_type` set to 'module' by default
- The `module_external_id` column is renamed to `item_external_id`
- All existing functionality continues to work

### Testing Checklist

- [ ] Run the database migration
- [ ] Test adding modules (existing functionality)
- [ ] Test adding exercises (new functionality)
- [ ] Test mixed days with both modules and exercises
- [ ] Test separate section display in day cards
- [ ] Test tabs in item selector
- [ ] Test search and filter for both types
- [ ] Test removing items of both types
- [ ] Verify visual distinction between types

## Visual Changes

### Day Card Layout

**Before:**

```
┌─────────────────────┐
│ Segunda, 14 Out     │
├─────────────────────┤
│ □ Module 1          │
│ □ Module 2          │
│                     │
│ [+ Adicionar]       │
└─────────────────────┘
```

**After:**

```
┌─────────────────────┐
│ Segunda, 14 Out     │
├─────────────────────┤
│ MÓDULOS             │
│ □ Module 1          │
│ □ Module 2          │
│                     │
│ EXERCÍCIOS          │
│ □ Exercise 1        │
│ □ Exercise 2        │
│                     │
│ [+ Adicionar]       │
└─────────────────────┘
```

### Item Selector

**New Tab Interface:**

- Tab 1: "Módulos" (BookOpen icon) - Shows all modules with level filters
- Tab 2: "Exercícios" (Dumbbell icon) - Shows all exercises with media badges

## Notes

- Migration is safe and backward compatible
- Existing weekly plans will continue to work
- All existing modules are automatically categorized as type 'module'
- No data loss during migration
- Exercises don't have level filters, so the selector adapts based on selected tab
- Both modules and exercises use the same removal and ordering logic
