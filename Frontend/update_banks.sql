-- Update banks table with the requested banks
INSERT INTO banks (name, code, status) VALUES
('Kogta Financial', 'KF', 'active'),
('SK Finance', 'SKF', 'active'),
('Cholamandalam Investment', 'CI', 'active'),
('ITI Finance', 'ITI', 'active'),
('Singhi Finance', 'SF', 'active'),
('HDB Finance', 'HDB', 'active'),
('MAS Finance', 'MAS', 'active'),
('Status Leasing Finance', 'SLF', 'active'),
('Sundram Finance', 'SUN', 'active'),
('Kisan Finance', 'KIS', 'active'),
('IKF Finance', 'IKF', 'active'),
('MMFSL', 'MMFSL', 'active'),
('AU Small Finance Bank', 'AU', 'active'),
('Ambit Finvest', 'AMB', 'active'),
('Tata Capital', 'TC', 'active'),
('Kamal Finserve', 'KFS', 'active')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;