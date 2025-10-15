const { Template } = require('../models');
const { connectDatabase } = require('../config/database');

const testTemplates = [
    {
        name: '浪漫婚纱照',
        description: '专业婚纱摄影风格，浪漫唯美',
        category: 'wedding',
        thumbnail_url: '/images/homepage/Generated Image September 04, 2025 - 2_37PM.jpeg',
        preview_url: '/images/homepage/Generated Image September 04, 2025 - 2_37PM.jpeg',
        idol_image_url: '/images/homepage/Generated Image September 04, 2025 - 2_38PM.jpeg',
        prompt: 'Transform the portrait into elegant wedding photography style with romantic lighting, soft focus, professional studio quality, dreamy atmosphere, white wedding dress, natural pose',
        is_vip_only: false,
        is_active: true,
        sort_order: 100,
        tags: ['婚纱', '浪漫', '专业摄影']
    },
    {
        name: '时尚大片',
        description: '时尚杂志封面风格',
        category: 'fashion',
        thumbnail_url: '/images/homepage/Generated Image September 04, 2025 - 2_39PM.jpeg',
        preview_url: '/images/homepage/Generated Image September 04, 2025 - 2_39PM.jpeg',
        idol_image_url: '/images/homepage/Generated Image September 04, 2025 - 2_40PM.jpeg',
        prompt: 'Transform into high fashion magazine cover style, professional model pose, dramatic lighting, editorial photography, glamorous makeup, stylish outfit, confident expression',
        is_vip_only: false,
        is_active: true,
        sort_order: 90,
        tags: ['时尚', '杂志', '大片']
    },
    {
        name: '艺术写真',
        description: '艺术风格人像摄影',
        category: 'art',
        thumbnail_url: '/images/homepage/Generated Image September 04, 2025 - 2_41PM.jpeg',
        preview_url: '/images/homepage/Generated Image September 04, 2025 - 2_41PM.jpeg',
        idol_image_url: '/images/homepage/Generated Image September 04, 2025 - 2_42PM.jpeg',
        prompt: 'Transform into artistic portrait photography style with creative composition, unique lighting, artistic atmosphere, expressive mood, professional retouching, artistic vision',
        is_vip_only: true,
        is_active: true,
        sort_order: 80,
        tags: ['艺术', '创意', 'VIP']
    },
    {
        name: '情侣写真',
        description: '浪漫情侣照片风格',
        category: 'couple',
        thumbnail_url: '/images/homepage/Generated Image September 04, 2025 - 2_43PM.jpeg',
        preview_url: '/images/homepage/Generated Image September 04, 2025 - 2_43PM.jpeg',
        idol_image_url: '/images/homepage/Generated Image September 04, 2025 - 2_44PM.jpeg',
        prompt: 'Transform into romantic couple photography style with sweet atmosphere, natural interaction, warm tones, candid moments, loving expression, intimate poses',
        is_vip_only: false,
        is_active: true,
        sort_order: 85,
        tags: ['情侣', '浪漫', '温馨']
    },
    {
        name: '生活记录',
        description: '自然生活化风格',
        category: 'life',
        thumbnail_url: '/images/homepage/Generated Image September 04, 2025 - 5_34PM.jpeg',
        preview_url: '/images/homepage/Generated Image September 04, 2025 - 5_34PM.jpeg',
        idol_image_url: '/images/homepage/Generated Image September 04, 2025 - 5_37PM.jpeg',
        prompt: 'Transform into natural lifestyle photography style with authentic moments, casual atmosphere, natural light, everyday beauty, candid shots, genuine expressions',
        is_vip_only: false,
        is_active: true,
        sort_order: 75,
        tags: ['生活', '自然', '日常']
    }
];

async function seedTemplates() {
    try {
        console.log('开始添加测试模板数据...\n');
        
        // 检查是否已有数据
        const existingCount = await Template.count();
        if (existingCount > 0) {
            console.log(`⚠️  数据库中已有 ${existingCount} 个模板`);
            console.log('是否要清空并重新添加？（请手动修改代码确认）\n');
            // 取消注释下面这行来清空现有数据
            // await Template.destroy({ where: {}, truncate: true });
            // console.log('已清空现有模板数据\n');
        }
        
        // 批量插入模板
        for (const templateData of testTemplates) {
            const template = await Template.create(templateData);
            console.log(`✅ 已添加模板: ${template.name} (ID: ${template.id})`);
        }
        
        console.log('\n🎉 测试模板数据添加完成！');
        console.log(`总共添加了 ${testTemplates.length} 个模板\n`);
        
        // 显示所有模板
        const allTemplates = await Template.findAll({
            order: [['sort_order', 'DESC']]
        });
        
        console.log('当前所有模板：');
        console.log('═══════════════════════════════════════');
        allTemplates.forEach((t, index) => {
            console.log(`${index + 1}. ${t.name} (${t.category}) ${t.is_vip_only ? '[VIP]' : ''}`);
            console.log(`   Prompt: ${t.prompt.substring(0, 60)}...`);
            console.log(`   偶像照片: ${t.idol_image_url}`);
            console.log('');
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ 添加测试数据失败:', error);
        process.exit(1);
    }
}

// 连接数据库并执行
connectDatabase().then(() => {
    seedTemplates();
}).catch((error) => {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
});











