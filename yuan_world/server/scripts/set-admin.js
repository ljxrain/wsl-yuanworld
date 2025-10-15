require('dotenv').config();
const { sequelize } = require('../config/database');
const { User } = require('../models');

async function setAdmin() {
    try {
        console.log('🔧 开始设置管理员权限...');
        
        // 获取最近注册的用户（通常就是您）
        const user = await User.findOne({
            order: [['created_at', 'DESC']]
        });
        
        if (!user) {
            console.error('❌ 未找到任何用户');
            process.exit(1);
        }
        
        console.log(`📋 找到用户: ${user.username} (${user.email || '无邮箱'})`);
        
        // 更新为管理员
        await user.update({ is_admin: true });
        
        console.log(`✅ 成功将用户 ${user.username} 设置为管理员！`);
        console.log('🎉 现在您可以刷新浏览器页面，重新执行导入脚本了。');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ 设置管理员失败:', error.message);
        process.exit(1);
    }
}

setAdmin();










