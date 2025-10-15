const { Template } = require('../models');
const { connectDatabase } = require('../config/database');

async function updateTemplates() {
    try {
        console.log('开始更新现有模板数据...\n');
        
        // 获取所有现有模板
        const templates = await Template.findAll({
            order: [['id', 'ASC']]
        });
        
        console.log(`找到 ${templates.length} 个现有模板\n`);
        
        // 为每个模板添加 prompt 和 idol_image_url
        const prompts = [
            'Transform the portrait into elegant wedding photography style with romantic lighting, soft focus, professional studio quality, dreamy atmosphere, white wedding dress, natural pose',
            'Transform into high fashion magazine cover style, professional model pose, dramatic lighting, editorial photography, glamorous makeup, stylish outfit, confident expression',
            'Transform into artistic portrait photography style with creative composition, unique lighting, artistic atmosphere, expressive mood, professional retouching, artistic vision',
            'Transform into romantic couple photography style with sweet atmosphere, natural interaction, warm tones, candid moments, loving expression, intimate poses',
            'Transform into natural lifestyle photography style with authentic moments, casual atmosphere, natural light, everyday beauty, candid shots, genuine expressions',
            'Transform into professional business portrait style with confident demeanor, formal attire, clean background, sharp focus, professional lighting'
        ];
        
        for (let i = 0; i < templates.length; i++) {
            const template = templates[i];
            
            // 如果还没有 prompt 和 idol_image_url，则添加
            if (!template.prompt || !template.idol_image_url) {
                template.prompt = prompts[i % prompts.length];
                template.idol_image_url = template.preview_url; // 暂时使用preview_url作为idol_image_url
                
                await template.save();
                console.log(`✅ 已更新模板 #${template.id}: ${template.name}`);
                console.log(`   Prompt: ${template.prompt.substring(0, 60)}...`);
                console.log(`   偶像照片: ${template.idol_image_url}`);
                console.log('');
            } else {
                console.log(`⏭️  模板 #${template.id}: ${template.name} 已有完整数据`);
            }
        }
        
        console.log('\n🎉 更新完成！\n');
        
        // 显示所有模板
        const allTemplates = await Template.findAll({
            order: [['sort_order', 'DESC'], ['id', 'ASC']]
        });
        
        console.log('当前所有模板：');
        console.log('═══════════════════════════════════════');
        allTemplates.forEach((t, index) => {
            console.log(`${index + 1}. ${t.name} (${t.category}) ${t.is_vip_only ? '[VIP]' : ''}`);
            console.log(`   ID: ${t.id}`);
            console.log(`   Prompt: ${t.prompt ? t.prompt.substring(0, 60) + '...' : '无'}`);
            console.log(`   偶像照片: ${t.idol_image_url || '无'}`);
            console.log('');
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ 更新失败:', error);
        process.exit(1);
    }
}

connectDatabase().then(() => {
    updateTemplates();
}).catch((error) => {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
});











