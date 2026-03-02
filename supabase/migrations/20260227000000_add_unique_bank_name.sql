-- Remove duplicate banks, keeping only the oldest one
DELETE FROM banks a USING banks b
WHERE a.id > b.id AND a.name = b.name;

-- Add unique constraint to banks.name if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'banks_name_unique'
  ) THEN
    ALTER TABLE banks ADD CONSTRAINT banks_name_unique UNIQUE (name);
  END IF;
END $$;

-- Add new banks/NBFCs
INSERT INTO banks (name, is_active, created_at) VALUES
('SK Finance', true, NOW()),
('Kogta Finance', true, NOW()),
('HDB Financial Services', true, NOW()),
('Tata Capital', true, NOW()),
('Cholamandalam Finance', true, NOW()),
('Sundaram Finance', true, NOW()),
('ITI Finance', true, NOW()),
('IKF Finance', true, NOW()),
('Shriram Finance', true, NOW())
ON CONFLICT (name) DO NOTHING;
