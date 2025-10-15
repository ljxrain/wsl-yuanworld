const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { sequelize } = require('../config/database-instance');
const { User } = require('../models');

async function resetPreviews() {
    if (!sequelize) {
        console.error("Sequelize is not initialized. Exiting.");
        return;
    }

    try {
        console.log('🚀 Resetting preview counts for all non-VIP users to 30...');
        
        const [results, metadata] = await sequelize.query(
            `UPDATE users SET daily_preview_count = 30, daily_preview_reset_date = CURRENT_DATE WHERE subscription_type = 'free'`
        );

        console.log(`✅ Done. ${metadata.rowCount} user(s) have been updated.`);

    } catch (error) {
        console.error('❌ Failed to reset preview counts:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('Script finished.');
    }
}

resetPreviews();










