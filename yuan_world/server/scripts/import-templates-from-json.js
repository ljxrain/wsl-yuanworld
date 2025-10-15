const fs = require('fs').promises;
const path = require('path');
const { Template } = require('../models');
const { connectDatabase } = require('../config/database');

async function importTemplates() {
    try {
        console.log('============================================');
        console.log('   模板数据导入工具 v1.0');
        console.log('============================================\n');
        
        // 读取JSON配置文件
        const configPath = path.join(__dirname, '../../templates-config.json');
        console.log(`📂 读取配置文件: ${configPath}\n`);
        
        const configData = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configData);
        
        if (!config.templates || !Array.isArray(config.templates)) {
            throw new Error('配置文件格式错误：找不到 templates 数组');
        }
        
        console.log(`✅ 配置文件加载成功，共 ${config.templates.length} 个模板\n`);
        
        // 显示导入选项
        console.log('请选择导入模式：');
        console.log('  1. 增量导入（只添加新模板，不修改已存在的）');
        console.log('  2. 覆盖导入（清空现有数据，重新导入）');
        console.log('  3. 更新模式（更新已存在的，添加新的）\n');
        
        // 这里默认使用增量导入，你可以修改为其他模式
        const importMode = process.env.IMPORT_MODE || '1';
        
        if (importMode === '2') {
            console.log('⚠️  警告：即将清空所有现有模板数据！\n');
            console.log('删除现有数据...');
            await Template.destroy({ where: {}, truncate: true });
            console.log('✅ 已清空现有数据\n');
        }
        
        console.log('开始导入模板...\n');
        console.log('════════════════════════════════════════\n');
        
        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        for (const templateData of config.templates) {
            try {
                // 验证必填字段
                const requiredFields = ['name', 'description', 'category', 'thumbnail_url', 'preview_url', 'idol_image_url', 'prompt'];
                const missingFields = requiredFields.filter(field => !templateData[field]);
                
                if (missingFields.length > 0) {
                    console.log(`❌ 模板 "${templateData.name || '未命名'}" 缺少必填字段: ${missingFields.join(', ')}`);
                    errorCount++;
                    continue;
                }
                
                // 检查分类是否有效
                const validCategories = ['life', 'couple', 'wedding', 'fashion', 'art'];
                if (!validCategories.includes(templateData.category)) {
                    console.log(`❌ 模板 "${templateData.name}" 的分类无效: ${templateData.category}`);
                    console.log(`   有效分类: ${validCategories.join(', ')}`);
                    errorCount++;
                    continue;
                }
                
                // 检查是否已存在（根据名称）
                const existingTemplate = await Template.findOne({ where: { name: templateData.name } });
                
                if (existingTemplate) {
                    if (importMode === '1') {
                        // 增量模式：跳过已存在的
                        console.log(`⏭️  跳过: ${templateData.name} (已存在)`);
                        skippedCount++;
                        continue;
                    } else if (importMode === '3') {
                        // 更新模式：更新已存在的
                        await existingTemplate.update(templateData);
                        console.log(`🔄 更新: ${templateData.name} (ID: ${existingTemplate.id})`);
                        updatedCount++;
                        continue;
                    }
                }
                
                // 创建新模板
                const newTemplate = await Template.create({
                    name: templateData.name,
                    description: templateData.description,
                    category: templateData.category,
                    thumbnail_url: templateData.thumbnail_url,
                    preview_url: templateData.preview_url,
                    idol_image_url: templateData.idol_image_url,
                    prompt: templateData.prompt,
                    is_vip_only: templateData.is_vip_only || false,
                    is_active: true,
                    sort_order: templateData.sort_order || 0,
                    usage_count: 0,
                    tags: templateData.tags || []
                });
                
                console.log(`✅ 添加: ${newTemplate.name} (ID: ${newTemplate.id})`);
                console.log(`   分类: ${newTemplate.category} | VIP: ${newTemplate.is_vip_only ? '是' : '否'}`);
                console.log(`   Prompt: ${newTemplate.prompt.substring(0, 50)}...`);
                console.log(`   偶像照片: ${newTemplate.idol_image_url}`);
                console.log('');
                
                addedCount++;
                
            } catch (error) {
                console.log(`❌ 导入失败: ${templateData.name || '未命名'}`);
                console.log(`   错误: ${error.message}\n`);
                errorCount++;
            }
        }
        
        console.log('════════════════════════════════════════\n');
        console.log('📊 导入统计：');
        console.log(`   ✅ 新增: ${addedCount} 个`);
        console.log(`   🔄 更新: ${updatedCount} 个`);
        console.log(`   ⏭️  跳过: ${skippedCount} 个`);
        console.log(`   ❌ 失败: ${errorCount} 个`);
        console.log('');
        
        // 显示所有模板
        const allTemplates = await Template.findAll({
            order: [['sort_order', 'DESC'], ['id', 'ASC']]
        });
        
        console.log('════════════════════════════════════════');
        console.log(`数据库中当前共有 ${allTemplates.length} 个模板：\n`);
        
        allTemplates.forEach((t, index) => {
            console.log(`${index + 1}. ${t.name} (${t.category}) ${t.is_vip_only ? '[VIP]' : ''}`);
            console.log(`   ID: ${t.id} | 排序: ${t.sort_order} | 使用次数: ${t.usage_count}`);
            console.log(`   偶像照片: ${t.idol_image_url}`);
            console.log(`   Prompt: ${t.prompt.substring(0, 60)}...`);
            console.log('');
        });
        
        console.log('════════════════════════════════════════');
        console.log('🎉 导入完成！');
        console.log('════════════════════════════════════════\n');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ 导入失败:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// 显示帮助信息
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
模板导入工具使用说明
════════════════════════════════════════

用法:
  node server/scripts/import-templates-from-json.js [选项]

选项:
  --help, -h              显示帮助信息
  
环境变量:
  IMPORT_MODE=1           增量导入（默认）
  IMPORT_MODE=2           覆盖导入（清空后重新导入）
  IMPORT_MODE=3           更新模式（更新已存在的）

示例:
  # 增量导入（默认）
  node server/scripts/import-templates-from-json.js
  
  # 覆盖导入
  IMPORT_MODE=2 node server/scripts/import-templates-from-json.js
  
  # 更新模式
  IMPORT_MODE=3 node server/scripts/import-templates-from-json.js

配置文件:
  templates-config.json（项目根目录）
  
图片目录:
  public/images/templates/
  
════════════════════════════════════════
    `);
    process.exit(0);
}

// 执行导入
connectDatabase().then(() => {
    importTemplates();
}).catch((error) => {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
});











