-- Solar Panels Table
CREATE TABLE IF NOT EXISTS solar_panels (
    id SERIAL PRIMARY KEY,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    wattage INTEGER,
    price_per_watt DECIMAL(10,2),
    efficiency DECIMAL(5,2),
    dimensions VARCHAR(50),
    warranty_years INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batteries Table
CREATE TABLE IF NOT EXISTS batteries (
    id SERIAL PRIMARY KEY,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    capacity_kwh DECIMAL(10,2),
    usable_capacity_kwh DECIMAL(10,2),
    depth_of_discharge DECIMAL(5,2),
    efficiency DECIMAL(5,2),
    price DECIMAL(10,2),
    warranty_years INTEGER,
    warranty_cycles INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inverters Table
CREATE TABLE IF NOT EXISTS inverters (
    id SERIAL PRIMARY KEY,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    power_rating_kw DECIMAL(10,2),
    max_input_voltage DECIMAL(10,2),
    efficiency DECIMAL(5,2),
    price DECIMAL(10,2),
    is_hybrid BOOLEAN,
    warranty_years INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Installation Costs Table
CREATE TABLE IF NOT EXISTS installation_costs (
    id SERIAL PRIMARY KEY,
    system_size_range_min_kw DECIMAL(10,2),
    system_size_range_max_kw DECIMAL(10,2),
    base_labor_cost DECIMAL(10,2),
    labor_cost_per_kw DECIMAL(10,2),
    consumables_percentage DECIMAL(5,2),
    additional_costs DECIMAL(10,2),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Location Solar Data Table
CREATE TABLE IF NOT EXISTS location_solar_data (
    id SERIAL PRIMARY KEY,
    region VARCHAR(100),
    average_sun_hours DECIMAL(4,2),
    seasonal_variation JSON,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample data for testing
INSERT INTO solar_panels (manufacturer, model, wattage, price_per_watt, efficiency, warranty_years)
VALUES 
    ('JA Solar', 'JAM72S30', 610, 3.50, 21.5, 25),
    ('Trina Solar', 'Vertex S+', 605, 3.45, 21.3, 25);

INSERT INTO batteries (manufacturer, model, capacity_kwh, usable_capacity_kwh, depth_of_discharge, efficiency, price)
VALUES 
    ('BYD', 'Premium HVM', 22.1, 19.89, 90, 95.5, 85000),
    ('Hubble', 'AM-5', 5.12, 4.86, 95, 94.5, 35000);

INSERT INTO inverters (manufacturer, model, power_rating_kw, efficiency, price, is_hybrid)
VALUES 
    ('Deye', 'SUN-12K-SG04LP3', 12, 98.0, 45000, true),
    ('Sunsynk', '8K', 8, 97.6, 35000, true);