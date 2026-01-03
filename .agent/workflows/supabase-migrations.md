---
description: Guidelines for writing Supabase migrations and RLS policies to avoid common issues
---

# Supabase Migration & RLS Best Practices

## RLS Policy Rules

### 1. ONE Policy Per Table Per Action
**Problem:** Having multiple permissive policies for the same role+action causes performance warnings.
**Wrong:**
```sql
CREATE POLICY "table_read" ON public.table FOR SELECT USING (true);
CREATE POLICY "table_write" ON public.table FOR ALL USING (...);
-- ❌ Both cover SELECT = "multiple permissive policies" warning
```

**Correct:**
```sql
-- Single policy with USING for reads, WITH CHECK for writes
CREATE POLICY "table_access" ON public.table FOR ALL
  USING (true)  -- Controls reads
  WITH CHECK ((SELECT auth.role()) = 'authenticated');  -- Controls writes
```

### 2. Always Use `(SELECT auth.uid())` Not `auth.uid()`
**Problem:** Direct `auth.uid()` calls re-evaluate for every row = performance issue.
**Wrong:**
```sql
USING (user_id = auth.uid())  -- ❌ Re-evaluates per row
```

**Correct:**
```sql
USING (user_id = (SELECT auth.uid()))  -- ✅ Evaluated once
```

Same applies to `auth.role()`, `current_setting()`, etc.

### 3. Idempotent Migrations
**Problem:** Migrations fail on re-run with "already exists" errors.

**Always use:**
```sql
DROP POLICY IF EXISTS "policy_name" ON public.table;
CREATE POLICY "policy_name" ON public.table ...;

DROP FUNCTION IF EXISTS function_name(args);
CREATE FUNCTION function_name(args) ...;
```

### 4. Handle Optional Tables
**Problem:** Migrations fail when referencing tables that may not exist yet.

**Wrap in conditional block:**
```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'optional_table') THEN
    -- Policy/trigger operations here
  END IF;
END $$;
```

### 5. Function Security (Mutable Search Path)
**Problem:** Functions without explicit search_path get security warnings.

**Always include:**
```sql
CREATE FUNCTION my_function()
RETURNS ... AS $$
  -- function body
$$ LANGUAGE plpgsql STABLE SET search_path = '';
```

### 6. Drop All Function Overloads
**Problem:** `DROP FUNCTION` fails if wrong signature specified.

**Dynamic drop for all signatures:**
```sql
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN 
    SELECT proname, pg_get_function_identity_arguments(oid) as args
    FROM pg_proc 
    WHERE proname = 'function_name' 
    AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.function_name(%s)', func_record.args);
  END LOOP;
END $$;
```

### 7. Dynamic Policy Cleanup
**When you need to wipe all existing policies on a table:**
```sql
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies 
             WHERE tablename = 'my_table' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.my_table', pol.policyname);
  END LOOP;
END $$;
```

---

## Quick Reference: Common Pattern

```sql
-- Standard table with public read, authenticated write
CREATE POLICY "tablename_access" ON public.tablename FOR ALL
  USING (true)
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- User-scoped table (only see/edit your own data)
CREATE POLICY "tablename_access" ON public.tablename FOR ALL
  USING (user_id = (SELECT auth.uid()) OR user_id IS NULL)
  WITH CHECK (user_id = (SELECT auth.uid()));
```
