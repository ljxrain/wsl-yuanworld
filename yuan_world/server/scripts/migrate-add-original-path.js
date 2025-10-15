const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { sequelize } = require('../config/database-instance');
const { DataTypes } = require('sequelize');

async function migrate() {
    if (!sequelize) {
        console.error("Sequelize is not initialized. Exiting.");
        return;
    }

    const queryInterface = sequelize.getQueryInterface();
    try {
        console.log('🚀 Migrating: Adding original_image_path to generations table...');

        const tables = await queryInterface.showAllTables();
        if (!tables.includes('generations')) {
            console.log('✅ "generations" table does not exist, likely a fresh install. Skipping migration.');
            return;
        }

        const columns = await queryInterface.describeTable('generations');

        if (columns.original_image_path) {
            console.log('✅ Column "original_image_path" already exists in the generations table.');
        } else {
            console.log('Adding column "original_image_path"...');
            await queryInterface.addColumn('generations', 'original_image_path', {
                type: DataTypes.STRING(500),
                allowNull: true,
                comment: 'Path to the original, non-watermarked high-resolution image on the server'
            });
            console.log('✅ Column "original_image_path" added successfully.');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('Migration script finished.');
    }
}

migrate();
