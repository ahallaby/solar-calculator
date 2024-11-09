// src/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('./config/db');
const calculator = require(path.join(__dirname, 'services', 'calculator'));
require('dotenv').config();

const app = express();
app.use(express.json());

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

// Input validation middleware
const validateCalculationInput = (req, res, next) => {
    try {
        const errors = calculator.validateInputs(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }
        next();
    } catch (error) {
        next(error);
    }
};

// Calculate with tariff and battery strategy
app.post('/api/calculate/with-battery-strategy', async (req, res) => {
    try {
        const {
            tariffId,
            batteryStrategy = 'evening-peak', // or 'dual-peak'
            batteryCapacity,
            batteryEfficiency = 0.95,
            ...calculationInput
        } = req.body;

        // Get tariff structure
        const tariffResult = await db.query(
            'SELECT * FROM tariff_structures WHERE id = $1 AND is_active = true',
            [tariffId]
        );
        
        if (tariffResult.rows.length === 0) {
            return res.status(404).json({ message: 'Tariff not found' });
        }

        const tariff = tariffResult.rows[0];

        // Get peak periods
        const peakPeriods = await db.query(
            'SELECT * FROM tariff_structures WHERE tariff_type_id = $1 AND name LIKE $2',
            [tariff.tariff_type_id, '%Peak Time%']
        );

        // Calculate with battery strategy
        const systemRequirements = calculator.calculateSystemRequirements({
            ...calculationInput,
            batteryCapacity,
            batteryEfficiency
        });

        const batteryUsage = calculator.calculateBatteryStrategy({
            batteryCapacity,
            batteryEfficiency,
            strategy: batteryStrategy,
            peakPeriods: peakPeriods.rows,
            systemRequirements
        });

        const financials = calculator.calculateFinancials(
            calculationInput,
            systemRequirements,
            tariff,
            batteryUsage
        );

        const environmental = calculator.calculateEnvironmentalImpact(
            calculationInput,
            systemRequirements
        );

        res.json({
            systemRequirements,
            batteryUsage,
            financials,
            environmental,
            tariffDetails: tariff
        });

    } catch (error) {
        console.error('Calculation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Calculation endpoint
app.post('/api/calculate/with-tariff', validateCalculationInput, async (req, res) => {
    try {
        const { tariffId, ...calculationInput } = req.body;
        
        // Get tariff structure
        const tariffResult = await db.query(
            'SELECT * FROM tariff_structures WHERE id = $1 AND is_active = true',
            [tariffId]
        );
        
        if (tariffResult.rows.length === 0) {
            return res.status(404).json({ message: 'Tariff not found' });
        }

        const tariff = tariffResult.rows[0];
        
        // Perform calculations
        const systemRequirements = calculator.calculateSystemRequirements(calculationInput);
        const financials = calculator.calculateFinancials(calculationInput, systemRequirements, tariff);
        const environmental = calculator.calculateEnvironmentalImpact(calculationInput, systemRequirements);

        // Add detailed monthly breakdown
        const monthlyBreakdown = Array.from({length: 12}, (_, month) => {
            const production = systemRequirements.monthlyProduction[month];
            const daysInMonth = new Date(2024, month + 1, 0).getDate();
            const consumption = calculationInput.annualEnergyConsumption / 365 * daysInMonth;
            
            return {
                month: month + 1,
                production,
                consumption,
                gridUsage: Math.max(0, consumption - production),
                selfConsumption: Math.min(production, consumption),
                exportedEnergy: Math.max(0, production - consumption)
            };
        });

        res.json({
            systemRequirements,
            financials,
            environmental,
            monthlyBreakdown,
            tariffDetails: tariff
        });

    } catch (error) {
        console.error('Calculation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Routes

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.post('/api/setup-multi-tenant', async (req, res) => {
    try {
        console.log('Starting multi-tenant setup...');
        const sqlFile = path.join(__dirname, 'db', 'multi-tenant.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        await db.query(sql);
        
        // Create default admin organization
        const orgResult = await db.query(`
            INSERT INTO organizations (name, contact_email, subscription_status)
            VALUES ($1, $2, 'active')
            RETURNING id
        `, ['Admin Organization', 'your-email@domain.com']);

        // Create admin user
        await db.query(`
            INSERT INTO users (organization_id, email, role, first_name, last_name)
            VALUES ($1, $2, 'admin', 'Admin', 'User')
        `, [orgResult.rows[0].id, 'your-email@domain.com']);

        // Update existing data to link with admin organization
        await db.query(`
            UPDATE solar_panels SET organization_id = $1, is_template = true;
            UPDATE batteries SET organization_id = $1, is_template = true;
            UPDATE inverters SET organization_id = $1, is_template = true;
            UPDATE tariff_types SET organization_id = $1, is_template = true;
            UPDATE tariff_structures SET organization_id = $1, is_template = true;
        `, [orgResult.rows[0].id]);

        res.json({
            message: 'Multi-tenant setup completed successfully',
            organizationId: orgResult.rows[0].id
        });
    } catch (error) {
        console.error('Multi-tenant setup error:', error);
        res.status(500).json({
            message: 'Error setting up multi-tenant support',
            error: error.message
        });
    }
});

app.get('/check-tables', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        res.json({
            message: 'Tables in database:',
            tables: result.rows.map(row => row.table_name)
        });
    } catch (error) {
        console.error('Error checking tables:', error.message);
        res.status(500).json({
            message: 'Error checking tables',
            error: error.message
        });
    }
});

app.get('/api/check-organization', async (req, res) => {
    try {
        // Check organizations
        const orgs = await db.query('SELECT * FROM organizations');
        
        // Check users
        const users = await db.query('SELECT * FROM users');
        
        // Check component links
        const componentCounts = await db.query(`
            SELECT 
                COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as linked,
                COUNT(*) as total,
                'solar_panels' as table_name
            FROM solar_panels
            UNION ALL
            SELECT 
                COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as linked,
                COUNT(*) as total,
                'batteries' as table_name
            FROM batteries
            UNION ALL
            SELECT 
                COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as linked,
                COUNT(*) as total,
                'inverters' as table_name
            FROM inverters
        `);
        
        res.json({
            organizations: orgs.rows,
            users: users.rows,
            componentLinks: componentCounts.rows
        });
    } catch (error) {
        console.error('Check error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/update-tables', async (req, res) => {
    try {
        console.log('Starting table updates...');
        const sqlFile = path.join(__dirname, 'db', 'add_org_columns.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        await db.query(sql);
        
        console.log('Tables updated successfully');
        res.json({
            message: 'Tables updated successfully'
        });
    } catch (error) {
        console.error('Table update error:', error);
        res.status(500).json({
            message: 'Error updating tables',
            error: error.message
        });
    }
});


app.get('/api/verify-sql', async (req, res) => {
    try {
        const sqlFile = path.join(__dirname, 'db', 'add_org_columns.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        // Split SQL into individual commands and execute them separately
        const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
        
        for (let command of commands) {
            console.log('Executing:', command);
            try {
                await db.query(command);
                console.log('Command successful');
            } catch (err) {
                console.log('Command error:', err.message);
            }
        }
        
        // Verify columns exist
        const tableChecks = await db.query(`
            SELECT 
                table_name, 
                column_name
            FROM information_schema.columns 
            WHERE column_name = 'organization_id'
            AND table_schema = 'public';
        `);
        
        res.json({
            message: 'SQL verification complete',
            tables: tableChecks.rows
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

// Debug Route
app.post('/api/debug-sql', async (req, res) => {
    try {
        console.log('Starting SQL debug...');
        
        // Create organizations table
        console.log('Creating organizations table...');
        await db.query(`
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
            )
        `);
        
        // Add organization_id to solar_panels
        console.log('Adding organization_id to solar_panels...');
        await db.query(`
            ALTER TABLE solar_panels 
            ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id)
        `);
        
        // Add organization_id to batteries
        console.log('Adding organization_id to batteries...');
        await db.query(`
            ALTER TABLE batteries 
            ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id)
        `);
        
        // Add organization_id to inverters
        console.log('Adding organization_id to inverters...');
        await db.query(`
            ALTER TABLE inverters 
            ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id)
        `);
        
        // Add organization_id to tariff_types
        console.log('Adding organization_id to tariff_types...');
        await db.query(`
            ALTER TABLE tariff_types 
            ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id)
        `);
        
        // Add organization_id to tariff_structures
        console.log('Adding organization_id to tariff_structures...');
        await db.query(`
            ALTER TABLE tariff_structures 
            ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id)
        `);
        
        // Verify columns
        console.log('Verifying columns...');
        const check = await db.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE column_name = 'organization_id' 
            AND table_schema = 'public'
        `);
        
        res.json({
            message: 'Debug SQL complete',
            tables: check.rows
        });
    } catch (error) {
        console.error('Debug SQL error:', error);
        res.status(500).json({
            error: error.message,
            detail: error.detail,
            hint: error.hint,
            where: error.where
        });
    }
});


app.get('/api/db-structure', async (req, res) => {
    try {
        // Get all tables
        const tablesResult = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        // Get columns for each table
        const structurePromises = tablesResult.rows.map(async (table) => {
            const columnsResult = await db.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = $1
            `, [table.table_name]);
            
            return {
                table: table.table_name,
                columns: columnsResult.rows
            };
        });
        
        const structure = await Promise.all(structurePromises);
        
        res.json({
            message: 'Database structure',
            structure: structure
        });
    } catch (error) {
        console.error('Structure check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Users Route
app.post('/api/update-users', async (req, res) => {
    try {
        // Create admin organization
        const orgResult = await db.query(`
            INSERT INTO organizations (name, contact_email, subscription_status)
            VALUES ('Admin Organization', 'admin@yourdomain.com', 'active')
            RETURNING id;
        `);

        const orgId = orgResult.rows[0].id;

        // Create admin user if doesn't exist
        const adminResult = await db.query(`
            INSERT INTO users (
                organization_id, 
                email, 
                role, 
                first_name, 
                last_name,
                is_active
            )
            SELECT 
                $1,
                'admin@yourdomain.com',
                'admin',
                'Admin',
                'User',
                true
            WHERE NOT EXISTS (
                SELECT 1 FROM users WHERE email = 'admin@yourdomain.com'
            )
            RETURNING id;
        `, [orgId]);

        // Update existing users without organization
        await db.query(`
            UPDATE users 
            SET organization_id = $1 
            WHERE organization_id IS NULL;
        `, [orgId]);

        // Check results
        const results = await db.query(`
            SELECT 
                o.name as org_name,
                COUNT(u.id) as user_count
            FROM organizations o
            LEFT JOIN users u ON u.organization_id = o.id
            GROUP BY o.id, o.name;
        `);

        res.json({
            message: 'Users updated successfully',
            organizations: results.rows
        });
    } catch (error) {
        console.error('Update users error:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

app.get('/api/check-setup', async (req, res) => {
    try {
        const orgs = await db.query('SELECT * FROM organizations');
        const users = await db.query('SELECT * FROM users');
        const components = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM solar_panels WHERE organization_id IS NOT NULL) as panels,
                (SELECT COUNT(*) FROM batteries WHERE organization_id IS NOT NULL) as batteries,
                (SELECT COUNT(*) FROM inverters WHERE organization_id IS NOT NULL) as inverters,
                (SELECT COUNT(*) FROM tariff_types WHERE organization_id IS NOT NULL) as tariffs
        `);

        res.json({
            organizations: orgs.rows,
            users: users.rows,
            linkedComponents: components.rows[0]
        });
    } catch (error) {
        console.error('Check setup error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Cleanup Route
app.post('/api/final-cleanup', async (req, res) => {
    try {
        // Start a transaction
        await db.query('BEGIN');

        // First add the columns if they don't exist
        const addColumns = `
            ALTER TABLE solar_panels 
            ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
            
            ALTER TABLE batteries 
            ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
            
            ALTER TABLE inverters 
            ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
            
            ALTER TABLE tariff_types 
            ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
            
            ALTER TABLE tariff_structures 
            ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
        `;

        // Execute each ALTER TABLE statement separately
        const alterStatements = addColumns.split(';').filter(stmt => stmt.trim());
        for (const stmt of alterStatements) {
            if (stmt.trim()) {
                await db.query(stmt);
            }
        }

        // Find the organization with linked users
        const orgWithUsers = await db.query(`
            SELECT o.id 
            FROM organizations o
            INNER JOIN users u ON u.organization_id = o.id
            LIMIT 1
        `);

        if (orgWithUsers.rows.length === 0) {
            throw new Error('No organization with users found');
        }

        const keepOrgId = orgWithUsers.rows[0].id;

        // Delete other organizations
        await db.query(`
            DELETE FROM organizations 
            WHERE id != $1
        `, [keepOrgId]);

        // Update the kept organization
        await db.query(`
            UPDATE organizations 
            SET 
                name = 'Admin Organization',
                contact_email = 'admin@yourdomain.com',
                is_active = true,
                subscription_status = 'active'
            WHERE id = $1
        `, [keepOrgId]);

        // Link all components to the organization
        const updateQueries = [
            'UPDATE solar_panels SET organization_id = $1, is_template = true WHERE organization_id IS NULL',
            'UPDATE batteries SET organization_id = $1, is_template = true WHERE organization_id IS NULL',
            'UPDATE inverters SET organization_id = $1, is_template = true WHERE organization_id IS NULL',
            'UPDATE tariff_types SET organization_id = $1, is_template = true WHERE organization_id IS NULL',
            'UPDATE tariff_structures SET organization_id = $1, is_template = true WHERE organization_id IS NULL'
        ];

        for (const query of updateQueries) {
            await db.query(query, [keepOrgId]);
        }

        // Get final counts
        const componentCounts = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM solar_panels WHERE organization_id = $1) as panels,
                (SELECT COUNT(*) FROM batteries WHERE organization_id = $1) as batteries,
                (SELECT COUNT(*) FROM inverters WHERE organization_id = $1) as inverters,
                (SELECT COUNT(*) FROM tariff_types WHERE organization_id = $1) as tariffs,
                (SELECT COUNT(*) FROM tariff_structures WHERE organization_id = $1) as tariff_structures
        `, [keepOrgId]);

        await db.query('COMMIT');

        res.json({
            message: 'Final cleanup completed successfully',
            organizationId: keepOrgId,
            componentCounts: componentCounts.rows[0]
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Final cleanup error:', error);
        res.status(500).json({ error: error.message });
    }
});