const { sequelize } = require('../config/database');
const { User, Generation, Template } = require('../models');

// 初始化模板数据 - 使用本地样片图片
const initialTemplates = [
    {
        id: 1,
        name: '心动日常',
        description: '自然清新的日常生活场景，展现最真实的美好瞬间',
        category: 'life',
        thumbnail_url: '/images/homepage/Generated Image September 04, 2025 - 2_37PM.jpeg',
        preview_url: '/images/homepage/Generated Image September 04, 2025 - 2_37PM.jpeg',
        laozhang_template_id: 'daily_life_001',
        is_vip_only: false,
        is_active: true,
        sort_order: 100,
        tags: ['清新', '日常', '自然']
    },
    {
        id: 2,
        name: '限定情侣',
        description: '甜蜜浪漫的情侣主题，记录你们的专属回忆',
        category: 'couple',
        thumbnail_url: '/images/homepage/Generated Image September 04, 2025 - 2_43PM.jpeg',
        preview_url: '/images/homepage/Generated Image September 04, 2025 - 2_43PM.jpeg',
        laozhang_template_id: 'couple_sweet_001',
        is_vip_only: false,
        is_active: true,
        sort_order: 90,
        tags: ['情侣', '浪漫', '甜蜜']
    },
    {
        id: 3,
        name: '梦中婚礼',
        description: '典雅华美的婚纱主题，成就你的公主梦',
        category: 'wedding',
        thumbnail_url: '/images/homepage/Generated Image September 04, 2025 - 5_56PM.jpeg',
        preview_url: '/images/homepage/Generated Image September 04, 2025 - 5_56PM.jpeg',
        laozhang_template_id: 'wedding_dream_001',
        is_vip_only: true,
        is_active: true,
        sort_order: 80,
        tags: ['婚纱', '典雅', '公主']
    },
    {
        id: 4,
        name: '都市风尚',
        description: '时尚前卫的都市风格，展现现代女性魅力',
        category: 'fashion',
        thumbnail_url: '/images/homepage/Generated Image September 04, 2025 - 2_38PM (1).jpeg',
        preview_url: '/images/homepage/Generated Image September 04, 2025 - 2_38PM (1).jpeg',
        laozhang_template_id: 'urban_fashion_001',
        is_vip_only: false,
        is_active: true,
        sort_order: 70,
        tags: ['都市', '时尚', '现代']
    },
    {
        id: 5,
        name: '森系文艺',
        description: '清新文艺的森林系风格，回归自然的纯净美好',
        category: 'life',
        thumbnail_url: '/images/homepage/Generated Image September 04, 2025 - 5_34PM.jpeg',
        preview_url: '/images/homepage/Generated Image September 04, 2025 - 5_34PM.jpeg',
        laozhang_template_id: 'forest_art_001',
        is_vip_only: true,
        is_active: true,
        sort_order: 60,
        tags: ['森系', '文艺', '自然']
    },
    {
        id: 6,
        name: '复古港风',
        description: '经典复古的港式风情，重现黄金年代的优雅',
        category: 'art',
        thumbnail_url: '/images/homepage/Generated Image September 10, 2025 - 1_17PM.png',
        preview_url: '/images/homepage/Generated Image September 10, 2025 - 1_17PM.png',
        laozhang_template_id: 'retro_hk_001',
        is_vip_only: true,
        is_active: true,
        sort_order: 50,
        tags: ['复古', '港风', '经典']
    }
];

// 创建初始用户
const createInitialUsers = async () => {
    try {
        // 创建管理员
        const adminExists = await User.findOne({ where: { email: 'admin@yuanworld.com' } });
        if (!adminExists) {
            await User.create({
                username: 'admin',
                email: 'admin@yuanworld.com',
                password: 'admin123456',
                subscription_type: 'yearly',
                subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                is_admin: true
            });
            console.log('✅ 管理员账户创建成功');
            console.log('   邮箱: admin@yuanworld.com');
            console.log('   密码: admin123456');
        } else {
            console.log('✅ 管理员账户已存在');
        }
        
        // 创建测试用户
        const testUserExists = await User.findOne({ where: { email: 'test@qq.com' } });
        if (!testUserExists) {
            await User.create({
                username: 'testuser',
                email: 'test@qq.com',
                password: '123456',
                subscription_type: 'free',
                is_admin: false
            });
            console.log('✅ 测试用户创建成功');
            console.log('   邮箱: test@qq.com');
            console.log('   密码: 123456');
        } else {
            console.log('✅ 测试用户已存在');
        }
    } catch (error) {
        console.error('❌ 创建用户失败:', error);
    }
};

// 初始化模板数据
const initializeTemplates = async () => {
    try {
        console.log('正在初始化模板数据...');
        
        for (const templateData of initialTemplates) {
            const existingTemplate = await Template.findByPk(templateData.id);
            if (!existingTemplate) {
                await Template.create(templateData);
                console.log(`✅ 创建模板: ${templateData.name}`);
            } else {
                console.log(`✅ 模板已存在: ${templateData.name}`);
            }
        }
        
        console.log('✅ 模板数据初始化完成');
    } catch (error) {
        console.error('❌ 初始化模板数据失败:', error);
    }
};

// 主初始化函数
const setupDatabase = async () => {
    try {
        console.log('🚀 开始初始化数据库...');
        console.log('环境:', process.env.NODE_ENV || 'development');
        
        // 连接数据库
        await sequelize.authenticate();
        console.log('✅ 数据库连接成功');
        
        // 同步数据库表
        console.log('正在同步数据库表结构...');
        // 使用 force: true 会删除现有表并重新创建（仅在初始化脚本中使用）
        await sequelize.sync({ force: true });
        console.log('✅ 数据库表结构同步完成');
        
        // 创建初始用户
        await createInitialUsers();
        
        // 初始化模板数据
        await initializeTemplates();
        
        console.log('🎉 数据库初始化完成!');
        console.log('');
        console.log('接下来你可以:');
        console.log('1. 启动服务器: npm start 或 node server/index.js');
        console.log('2. 访问网站: http://localhost:8080');
        console.log('3. 使用管理员账户登录管理后台');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error);
        process.exit(1);
    }
};

// 如果直接运行此脚本
if (require.main === module) {
    setupDatabase();
}

module.exports = {
    setupDatabase,
    createInitialUsers,
    initializeTemplates
};



