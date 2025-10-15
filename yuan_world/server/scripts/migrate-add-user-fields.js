require('dotenv').config();
const { sequelize } = require('../config/database');

async function addUserFields() {
    try {
        console.log('馃攧 寮€濮嬫坊鍔犵敤鎴疯〃瀛楁...');

        // 娣诲姞 balance 瀛楁
        await sequelize.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS balance DECIMAL(10, 2) DEFAULT 0;
        `);
        console.log('鉁?balance 瀛楁娣诲姞鎴愬姛');

        // 娣诲姞 free_previews 瀛楁
        await sequelize.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS free_previews INTEGER DEFAULT 30;
        `);
        console.log('鉁?free_previews 瀛楁娣诲姞鎴愬姛');

        // 娣诲姞 is_vip 瀛楁
        await sequelize.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;
        `);
        console.log('鉁?is_vip 瀛楁娣诲姞鎴愬姛');

        // 娣诲姞 vip_expiry 瀛楁
        await sequelize.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS vip_expiry TIMESTAMP;
        `);
        console.log('鉁?vip_expiry 瀛楁娣诲姞鎴愬姛');

        // 娣诲姞 vip_level 瀛楁
        await sequelize.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS vip_level INTEGER DEFAULT 0;
        `);
        console.log('鉁?vip_level 瀛楁娣诲姞鎴愬姛');

        console.log('馃帀 鎵€鏈夊瓧娈垫坊鍔犲畬鎴愶紒');
        process.exit(0);
    } catch (error) {
        console.error('鉂?杩佺Щ澶辫触:', error.message);
        process.exit(1);
    }
}

addUserFields();









