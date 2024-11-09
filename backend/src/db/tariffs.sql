-- Tariff Types Table
CREATE TABLE IF NOT EXISTS tariff_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),          -- e.g., "Residential", "Commercial", "Industrial", "Time of Use"
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tariff Structures Table
CREATE TABLE IF NOT EXISTS tariff_structures (
    id SERIAL PRIMARY KEY,
    tariff_type_id INTEGER REFERENCES tariff_types(id),
    name VARCHAR(100),          -- e.g., "Business Rate 1", "Residential Block 1"
    season VARCHAR(50),         -- "Summer", "Winter", etc.
    start_time TIME,           -- For time-of-use rates
    end_time TIME,             -- For time-of-use rates
    energy_charge DECIMAL(10,2), -- Cost per kWh
    demand_charge DECIMAL(10,2), -- Cost per kW if applicable
    block_start INTEGER,        -- kWh threshold for block rates
    block_end INTEGER,          -- kWh threshold end for block rates
    fixed_charge DECIMAL(10,2), -- Monthly fixed charges
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample tariff types
INSERT INTO tariff_types (name, description) VALUES
    ('Residential Flat', 'Standard residential flat rate'),
    ('Business TOU', 'Time of use rate for businesses'),
    ('Industrial', 'Industrial rates with demand charges');

-- Insert sample tariff structures
INSERT INTO tariff_structures 
    (tariff_type_id, name, season, start_time, end_time, energy_charge, demand_charge, fixed_charge)
VALUES
    -- Residential flat rate
    (1, 'Standard Residential', 'All Year', NULL, NULL, 3.00, 0, 150),
    
    -- Business Time of Use
    (2, 'Peak Time', 'Summer', '07:00', '19:00', 3.50, 0, 250),
    (2, 'Off-Peak', 'Summer', '19:00', '07:00', 2.50, 0, 250),
    (2, 'Peak Time', 'Winter', '07:00', '19:00', 3.20, 0, 250),
    (2, 'Off-Peak', 'Winter', '19:00', '07:00', 2.20, 0, 250),
    
    -- Industrial with demand charges
    (3, 'Industrial Rate', 'All Year', NULL, NULL, 2.80, 150, 500);