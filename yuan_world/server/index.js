const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 导入路由
const authRoutes = require('./routes/auth');
const generateRoutes = require('./routes/generate');
const statsRoutes = require('./routes/stats');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const templateRoutes = require('./routes/templates');

// 导入数据库连接
const { connectDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 8080;

// 中间件设置 - 开发环境暂时禁用helmet的CSP
// app.use(helmet()); // 开发环境暂时注释，避免CSP问题
app.use(compression()); // 压缩响应
app.use(morgan('combined')); // 请求日志

// CORS设置
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'your-domain.com' : true,
    credentials: true
}));

// 请求限制 - 根据环境调整
const isDevelopment = process.env.NODE_ENV !== 'production';

if (!isDevelopment) {
    // 生产环境：合理的速率限制
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15分钟
        max: 1000, // 限制每个IP 1000次请求（提高10倍）
        message: '请求过于频繁，请稍后再试',
        standardHeaders: true, // 返回速率限制信息在 `RateLimit-*` headers
        legacyHeaders: false, // 禁用 `X-RateLimit-*` headers
    });
    app.use(limiter);

    // 生产环境：生图API限制
    const generateLimiter = rateLimit({
        windowMs: 60 * 1000, // 1分钟
        max: 20, // 每分钟最多20次生图请求（提高4倍）
        message: '生图请求过于频繁，请稍后再试'
    });
    app.use('/api/generate', generateLimiter);
    
    console.log('✅ 生产环境速率限制已启用');
} else {
    // 开发环境：极宽松的限制（仅防止明显的滥用）
    const limiter = rateLimit({
        windowMs: 1 * 60 * 1000, // 1分钟
        max: 10000, // 每分钟10000次请求
        message: '请求过于频繁，请稍后再试'
    });
    app.use(limiter);
    
    console.log('🔓 开发环境：速率限制已大幅放宽');
}

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/before-after', require('./routes/before-after'));

// 健康检查端点（用于Docker和负载均衡器）
app.get('/health', async (req, res) => {
    try {
        // 检查数据库连接
        const { sequelize } = require('./config/database-instance');
        await sequelize.authenticate();

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: 'connected',
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('健康检查失败:', error);
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error.message
        });
    }
});

// 保留旧的API健康检查端点以向后兼容
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 首页图片列表API
app.get('/api/homepage/images', (req, res) => {
    const fs = require('fs');
    const homepageDir = path.join(__dirname, '../public/images/homepage');
    
    try {
        // 检查目录是否存在
        if (!fs.existsSync(homepageDir)) {
            return res.json({ images: [] });
        }
        
        // 读取目录中的所有文件
        const files = fs.readdirSync(homepageDir);
        
        // 过滤出图片文件
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return imageExtensions.includes(ext);
        });
        
        res.json({ 
            images: imageFiles,
            count: imageFiles.length 
        });
    } catch (error) {
        console.error('读取首页图片失败:', error);
        res.json({ images: [] });
    }
});

// 前端路由 - 处理SPA路由
app.get('*', (req, res) => {
    // 如果是API请求，返回404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API接口不存在' });
    }
    
    // 否则返回前端页面
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 全局错误处理
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    
    // Multer文件上传错误
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: '文件大小超过限制' });
    }
    
    // 数据库错误
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
            message: '数据验证失败', 
            details: error.errors.map(e => e.message) 
        });
    }
    
    res.status(500).json({ 
        message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message 
    });
});

// 启动服务器
const startServer = async () => {
    try {
        // 连接数据库
        await connectDatabase();
        console.log('✅ 数据库连接成功');
        
        // 启动服务器
        app.listen(PORT, () => {
            console.log(`🚀 源世界服务器启动成功！`);
            console.log(`📍 服务器地址: http://localhost:${PORT}`);
            console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
            console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
        });
    } catch (error) {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
};

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，开始优雅关闭...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('收到SIGINT信号，开始优雅关闭...');
    process.exit(0);
});

startServer();

