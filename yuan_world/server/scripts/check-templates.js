const { Template } = require('../models');
const { connectDatabase } = require('../config/database');

async function checkTemplates() {
    try {
        await connectDatabase();
        
        const templates = await Template.findAll();
        console.log('========================================');
        console.log(`检查模板数据 - 共 ${templates.length} 个模板`);
        console.log('========================================\n');
        
        let hasIssues = false;
        
        templates.forEach((t, index) => {
            console.log(`${index + 1}. ID: ${t.id}, 名称: ${t.name}`);
            
            // 检查 idol_image_url
            if (!t.idol_image_url || t.idol_image_url.trim() === '') {
                console.log('   ❌ 缺少 idol_image_url');
                hasIssues = true;
            } else {
                console.log(`   ✅ idol_image_url: ${t.idol_image_url}`);
            }
            
            // 检查 prompt
            if (!t.prompt || t.prompt.trim() === '') {
                console.log('   ❌ 缺少 prompt');
                hasIssues = true;
            } else {
                console.log(`   ✅ prompt: ${t.prompt.substring(0, 50)}...`);
            }
            
            console.log('');
        });
        
        if (hasIssues) {
            console.log('❌ 发现问题：部分模板缺少必要字段！');
            console.log('请运行修复脚本：node server/scripts/update-existing-templates.js');
        } else {
            console.log('✅ 所有模板数据完整！');
        }
        
        process.exit(hasIssues ? 1 : 0);
    } catch (error) {
        console.error('检查失败:', error);
        process.exit(1);
    }
}

checkTemplates();











