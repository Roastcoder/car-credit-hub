-- Connect to your database first:
psql "postgres://mehar:Mehar%406378110608@187.77.187.120:5431/meh"

-- Create financers table
CREATE TABLE IF NOT EXISTS financers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert all financers
INSERT INTO financers (name, code) VALUES
('Kogta Financial', 'KF'),
('SK Finance', 'SKF'),
('Cholamandalam Investment', 'CI'),
('ITI Finance', 'ITI'),
('Singhi Finance', 'SF'),
('HDB Finance', 'HDB'),
('MAS Finance', 'MAS'),
('Status Leasing Finance', 'SLF'),
('Sundram Finance', 'SUN'),
('Kisan Finance', 'KIS'),
('IKF Finance', 'IKF'),
('MMFSL', 'MMFSL'),
('AU Small Finance Bank', 'AU'),
('Ambit Finvest', 'AMB'),
('Bajaj Finance', 'BAJ'),
('Tata Capital', 'TC'),
('Kotak Mahindra', 'KM'),
('Kamal Finserve', 'KFS')
ON CONFLICT (name) DO NOTHING;

-- Verify the data
SELECT id, name, code, status FROM financers ORDER BY name;