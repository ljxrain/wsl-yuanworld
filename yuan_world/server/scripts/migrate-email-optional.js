const { sequelize } = require('../config/database');

async function migrate() {
    try {
        console.log('开始迁移：修改邮箱字段为可选...\n');
        
        // 修改 email 字段允许为空
        await sequelize.query(`
            ALTER TABLE users 
            ALTER COLUMN email DROP NOT NULL;
        `);
        console.log('✅ 邮箱字段现在允许为空');
        
        // 删除邮箱唯一约束（如果存在）
        try {
            await sequelize.query(`
                ALTER TABLE users 
                DROP CONSTRAINT IF EXISTS users_email_key;
            `);
            console.log('✅ 已删除邮箱唯一约束');
        } catch (e) {
            console.log('⏭️  邮箱唯一约束不存在或已删除');
        }
        
        console.log('\n🎉 迁移完成！\n');
        console.log('现在用户可以：');
        console.log('- 使用用户名注册（邮箱可选）');
        console.log('- 使用用户名或邮箱登录\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ 迁移失败:', error.message);
        console.error(error);
        process.exit(1);
    }
}

const { connectDatabase } = require('../config/database');
connectDatabase().then(() => {
    migrate();
}).catch((error) => {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
});











