-- First ensure organizations table exists
CREATE TABLE IF NOT EXISTS organizations (
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

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
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
ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

ALTER TABLE batteries 
ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

ALTER TABLE inverters 
ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

ALTER TABLE tariff_types 
ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

ALTER TABLE tariff_structures 
ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_users ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_panels ON solar_panels(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_org_batteries ON batteries(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_org_inverters ON inverters(organization_id) WHERE organization_id IS NOT NULL;