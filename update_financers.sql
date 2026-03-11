-- Create financers table if it doesn't exist
CREATE TABLE IF NOT EXISTS financers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing data and insert new financers
TRUNCATE TABLE financers RESTART IDENTITY CASCADE;

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
('Kamal Finserve', 'KFS');

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_financers_updated_at ON financers;
CREATE TRIGGER update_financers_updated_at
    BEFORE UPDATE ON financers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();