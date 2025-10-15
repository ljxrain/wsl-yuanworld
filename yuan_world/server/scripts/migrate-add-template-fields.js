const { sequelize } = require('../config/database');
const { QueryInterface } = require('sequelize');

async function migrate() {
    try {
        console.log('开始迁移：添加模板新字段...');
        
        const queryInterface = sequelize.getQueryInterface();
        const tableDescription = await queryInterface.describeTable('templates');
        
        // 检查并添加 idol_image_url 字段
        if (!tableDescription.idol_image_url) {
            console.log('添加 idol_image_url 字段...');
            await queryInterface.addColumn('templates', 'idol_image_url', {
                type: sequelize.Sequelize.STRING(500),
                allowNull: true, // 暂时允许为空，迁移后可以改为 false
                comment: '偶像照片地址（用于生图）',
                after: 'preview_url'
            });
            console.log('✅ idol_image_url 字段添加成功');
        } else {
            console.log('⏭️  idol_image_url 字段已存在');
        }
        
        // 检查并添加 prompt 字段
        if (!tableDescription.prompt) {
            console.log('添加 prompt 字段...');
            await queryInterface.addColumn('templates', 'prompt', {
                type: sequelize.Sequelize.TEXT,
                allowNull: true, // 暂时允许为空
                comment: '生图提示词',
                after: 'idol_image_url'
            });
            console.log('✅ prompt 字段添加成功');
        } else {
            console.log('⏭️  prompt 字段已存在');
        }
        
        // 修改 laozhang_template_id 允许为空（跳过，因为这需要删除unique约束再重建）
        console.log('⏭️  跳过 laozhang_template_id 字段修改（已存在）');
        
        console.log('\n🎉 迁移完成！');
        process.exit(0);
    } catch (error) {
        console.error('❌ 迁移失败:', error);
        process.exit(1);
    }
}

// 连接数据库并执行迁移
const { connectDatabase } = require('../config/database');
connectDatabase().then(() => {
    migrate();
}).catch((error) => {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
});

