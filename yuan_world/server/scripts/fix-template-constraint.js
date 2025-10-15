const { sequelize } = require('../config/database');

async function fixConstraint() {
    try {
        console.log('修复 laozhang_template_id 字段约束...\n');
        
        // 直接执行 SQL 修改约束
        await sequelize.query(
            'ALTER TABLE templates ALTER COLUMN laozhang_template_id DROP NOT NULL;'
        );
        
        console.log('✅ laozhang_template_id 字段现在允许为空了！\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ 修复失败:', error.message);
        process.exit(1);
    }
}

const { connectDatabase } = require('../config/database');
connectDatabase().then(() => {
    fixConstraint();
}).catch((error) => {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
});











