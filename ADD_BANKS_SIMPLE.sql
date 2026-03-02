-- Simply insert new banks, ignoring if they already exist by name
INSERT INTO banks (name, is_active, created_at)
SELECT 'SK Finance', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM banks WHERE name = 'SK Finance');

INSERT INTO banks (name, is_active, created_at)
SELECT 'Kogta Finance', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM banks WHERE name = 'Kogta Finance');

INSERT INTO banks (name, is_active, created_at)
SELECT 'HDB Financial Services', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM banks WHERE name = 'HDB Financial Services');

INSERT INTO banks (name, is_active, created_at)
SELECT 'Tata Capital', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM banks WHERE name = 'Tata Capital');

INSERT INTO banks (name, is_active, created_at)
SELECT 'Cholamandalam Finance', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM banks WHERE name = 'Cholamandalam Finance');

INSERT INTO banks (name, is_active, created_at)
SELECT 'Sundaram Finance', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM banks WHERE name = 'Sundaram Finance');

INSERT INTO banks (name, is_active, created_at)
SELECT 'ITI Finance', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM banks WHERE name = 'ITI Finance');

INSERT INTO banks (name, is_active, created_at)
SELECT 'IKF Finance', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM banks WHERE name = 'IKF Finance');

INSERT INTO banks (name, is_active, created_at)
SELECT 'Shriram Finance', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM banks WHERE name = 'Shriram Finance');
