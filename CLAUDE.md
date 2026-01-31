# Claude Code Instructions for Needed

## CRITICAL: Database Safety Rules

**NEVER run these commands without explicit user approval:**
- `supabase db reset` - Destroys ALL data
- `supabase db push --reset` - Destroys ALL data
- `DROP TABLE`, `TRUNCATE TABLE` - Destroys data
- Any SQL that deletes or modifies existing data

**Before ANY database migration or reset:**
1. ALWAYS ask the user first: "This will affect the database. Should I proceed?"
2. Explain what data will be affected
3. Wait for explicit "yes" confirmation

**Safe database operations (no approval needed):**
- `supabase db diff` - Shows pending changes
- `supabase migration new` - Creates new migration file
- `supabase status` - Shows status
- Reading from tables (SELECT)
- Creating new migrations that only ADD tables/columns

## Testing Database Changes

When testing migrations:
1. Use `supabase db diff` to preview changes
2. Create a new migration file with `supabase migration new <name>`
3. Apply with `supabase migration up` (additive only)
4. NEVER use `db reset` to test - it destroys data

## Project Structure

- `/supabase/migrations/` - Database migrations (ordered by timestamp)
- `/supabase/seed/` - Test seed data (for development only)
- `/public/data/` - Static data files (NZ localities, etc.)

## Development vs Production

Local Supabase is still the user's development database with real test data.
Treat it with care - data loss is disruptive even in development.
