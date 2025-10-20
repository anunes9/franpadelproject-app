# Weekly Planning Feature - Installation Notes

## Required Dependencies

Before running the application, you need to install the following missing dependency:

```bash
npm install @radix-ui/react-dialog
```

This package is required for the dialog/modal component used in the Module Selector.

## Running the Database Migration

After installing dependencies, run the database migration:

```bash
# If using Supabase locally
supabase migration up

# Or if using Supabase remote
# Run the migration through Supabase dashboard or CLI
```

The migration file is located at:

```
supabase/migrations/003_add_weekly_planning_tables.sql
```

## Verification

After installation and migration:

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Navigate to the dashboard at `http://localhost:3000/dashboard`

3. You should see a new "Planeamento Semanal" card

4. Click on it or use the "Planeamento" link in the header navigation

5. You should see the weekly planning calendar with the current week

## Troubleshooting

### Missing @radix-ui/react-dialog

**Error**: `Cannot find module '@radix-ui/react-dialog'`
**Solution**: Run `npm install @radix-ui/react-dialog`

### Migration Issues

**Error**: Tables already exist
**Solution**: The migration is idempotent. If tables exist, you may need to check if they match the schema or drop and recreate them.

### TypeScript Errors

**Error**: Type errors in dialog component
**Solution**: Ensure `@radix-ui/react-dialog` is installed and restart the TypeScript server in your IDE

### RLS Policy Issues

**Error**: Users can't access their weekly plans
**Solution**: Verify that the `is_admin()` function exists (created in migration 001) and that RLS is enabled on the tables

## Development Notes

- The feature uses ISO 8601 week numbering (weeks start on Monday)
- All UI text is in Portuguese (pt-PT)
- The calendar is responsive and works on mobile devices
- Week navigation is done through URL parameters (`?year=2025&week=42`)
- The feature integrates with existing Contentful modules
