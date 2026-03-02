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
