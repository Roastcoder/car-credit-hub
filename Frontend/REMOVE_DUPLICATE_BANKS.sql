-- Step 1: Update loans to point to the first occurrence of each duplicate bank
WITH duplicates AS (
  SELECT name, MIN(id) as keep_id, ARRAY_AGG(id) as all_ids
  FROM banks
  GROUP BY name
  HAVING COUNT(*) > 1
)
UPDATE loans
SET assigned_bank_id = d.keep_id
FROM duplicates d
WHERE loans.assigned_bank_id = ANY(d.all_ids)
  AND loans.assigned_bank_id != d.keep_id;

-- Step 2: Delete duplicate banks, keeping only the oldest one
DELETE FROM banks
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at, id) as rn
    FROM banks
  ) t WHERE rn > 1
);

-- Step 3: Show remaining banks
SELECT name, COUNT(*) as count FROM banks GROUP BY name ORDER BY name;
