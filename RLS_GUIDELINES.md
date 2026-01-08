# RLS Best Practices & Troubleshooting Guide

## The "Family Visibility" Incident (Jan 2026)
**Issue:** Users could not see their family members or the family itself, despite having rows in the database.
**Cause:**
1. **Recursive RLS:** The `family_members` policy used a subquery that queried `family_members` itself, causing infinite recursion.
2. **Empty Search Path:** The helper function `user_family_ids()` had `SET search_path = ''`. This caused queries inside it (or dependent policies) to fail silently or return 0 rows because they couldn't find tables/functions in `public` or `auth`.
3. **Restrictive Families Policy:** The `families` table policy did not correctly use the helper function to allow access via membership.

## Golden Rules for RLS

### 1. Avoid Recursive Policies
**Bad:** querying the same table in its own policy.
```sql
CREATE POLICY "view_members" ON family_members
  USING (family_id IN (SELECT family_id FROM family_members WHERE ...)) -- DANGER
```
**Good:** Use a `SECURITY DEFINER` function to break the chain.
```sql
CREATE POLICY "view_members" ON family_members
  USING (family_id IN (SELECT get_user_family_ids()))
```

### 2. Configure `search_path` Correctly
Always set `search_path` for `SECURITY DEFINER` functions to ensure they can access necessary schemas safely.
```sql
CREATE FUNCTION ...
SECURITY DEFINER
SET search_path = public, auth; -- CRITICAL
```

### 3. Handle Dependencies with Care
If a function is used by many policies, you cannot `DROP` it. Use `CREATE OR REPLACE` to update it in-place.

### 4. Debugging RLS
If a query returns 0 rows (Error `PGRST116` in Supabase client for `.single()`), check:
- Is there a policy on the table?
- Does the policy allow access?
- If using a helper function, does it return the expected IDs?
- Is there a silent failure in a `SECURITY DEFINER` function (e.g., search_path)?

## Standard Helper Functions
Use these standard, tested functions for family access:
- `get_current_user_family_ids()`: Returns UUIDs of families the user belongs to.
- `user_has_family_access(family_id)`: Boolean check.
- `user_is_family_admin(family_id)`: Boolean check.

## Performance & Optimization (New!)

### 5. Wrap Auth Calls
Functions like `auth.uid()`, `auth.jwt()`, and `current_setting()` can be expensive if evaluated for every row.
**Bad:**
```sql
using ( auth.uid() = user_id )
```
**Good:** Wrap in a scalar subquery so Postgres executes it once per query (InitPlan).
```sql
using ( (SELECT auth.uid()) = user_id )
```

### 6. Avoid Duplicate Policies
Don't have multiple permissive policies for the same action (e.g., "admin access" AND "user access" as separate policies). Postgres has to check *all* of them (OR condition).
**Bad:**
- Policy A: `user_id = (select auth.uid())`
- Policy B: `exists (select 1 from admins ...)`
**Good:** Combine them into one policy.
```sql
using (
  user_id = (select auth.uid())
  OR
  exists (select 1 from admins ...)
)
```
**Also:** Clean up old policies! Don't leave "English sentence" policies (e.g., "Users can view...") alongside snake_case ones (`table_select`). Pick one convention (snake_case recommended) and stick to it.
