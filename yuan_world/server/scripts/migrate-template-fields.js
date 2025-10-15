require('dotenv').config();
const { sequelize } = require('../config/database');

async function migrateTemplateFields() {
    try {
        console.log('🔧 开始更新 templates 表结构...');

        // 添加 image_path 字段
        await sequelize.query(`
            ALTER TABLE templates 
            ADD COLUMN IF NOT EXISTS image_path VARCHAR(500);
        `);
        console.log('✅ image_path 字段添加成功');

        // 修改旧字段为可空
        await sequelize.query(`
            ALTER TABLE templates 
            ALTER COLUMN thumbnail_url DROP NOT NULL;
        `);
        console.log('✅ thumbnail_url 改为可空');

        await sequelize.query(`
            ALTER TABLE templates 
            ALTER COLUMN preview_url DROP NOT NULL;
        `);
        console.log('✅ preview_url 改为可空');

        await sequelize.query(`
            ALTER TABLE templates 
            ALTER COLUMN idol_image_url DROP NOT NULL;
        `);
        console.log('✅ idol_image_url 改为可空');

        await sequelize.query(`
            ALTER TABLE templates 
            ALTER COLUMN prompt DROP NOT NULL;
        `);
        console.log('✅ prompt 改为可空');

        console.log('🎉 模板表结构更新完成！');
        process.exit(0);
    } catch (error) {
        console.error('❌ 迁移失败:', error.message);
        process.exit(1);
    }
}

migrateTemplateFields();










