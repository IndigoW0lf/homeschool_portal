-- Deduplicate external_curriculum and enforce one row per (kid, date, task)
-- so imports (paste, PDF, or crawl) never create duplicates for the same kid.

-- 1. Remove duplicate rows, keeping the one with the smallest id per (kid_id, date, task_name)
DELETE FROM external_curriculum a
USING external_curriculum b
WHERE a.kid_id = b.kid_id
  AND a.date = b.date
  AND a.task_name = b.task_name
  AND a.id > b.id;

-- 2. Enforce uniqueness: one record per kid + date + task
ALTER TABLE external_curriculum
ADD CONSTRAINT external_curriculum_kid_date_task_key UNIQUE (kid_id, date, task_name);

COMMENT ON CONSTRAINT external_curriculum_kid_date_task_key ON external_curriculum IS
  'Prevents duplicate imported rows for the same kid, date, and task (e.g. re-import from MiAcademy).';
