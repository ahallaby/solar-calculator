-- Organizations (Solar Installers) Table
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    logo_url TEXT,
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    subscription_status VARCHAR(50) DEFAULT 'trial',
    subscription_expires TIMESTAMP,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table with Organization Link
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add organization_id to existing tables
ALTER TABLE solar_panels 
ADD COLUMN organization_id INTEGER REFERENCES organizations(id),
ADD COLUMN is_template BOOLEAN DEFAULT false;

ALTER TABLE batteries 
ADD COLUMN organization_id INTEGER REFERENCES organizations(id),
ADD COLUMN is_template BOOLEAN DEFAULT false;

ALTER TABLE inverters 
ADD COLUMN organization_id INTEGER REFERENCES organizations(id),
ADD COLUMN is_template BOOLEAN DEFAULT false;

ALTER TABLE tariff_types 
ADD COLUMN organization_id INTEGER REFERENCES organizations(id),
ADD COLUMN is_template BOOLEAN DEFAULT false;

ALTER TABLE tariff_structures 
ADD COLUMN organization_id INTEGER REFERENCES organizations(id),
ADD COLUMN is_template BOOLEAN DEFAULT false;

-- Calculations Table (for tracking all calculations)
CREATE TABLE calculations (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    user_id INTEGER REFERENCES users(id),
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    input_parameters JSONB,
    results JSONB,
    pdf_url TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Templates Table (for saving calculation templates)
CREATE TABLE templates (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    input_parameters JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Keys Table
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    permissions JSONB,
    last_used TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_org_users ON users(organization_id);
CREATE INDEX idx_org_calcs ON calculations(organization_id);
CREATE INDEX idx_org_templates ON templates(organization_id);
CREATE INDEX idx_org_panels ON solar_panels(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_org_batteries ON batteries(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_org_inverters ON inverters(organization_id) WHERE organization_id IS NOT NULL;

-- Create a function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_organization_timestamp BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_timestamp BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calculation_timestamp BEFORE UPDATE ON calculations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();