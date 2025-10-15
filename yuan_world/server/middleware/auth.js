const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: '访问被拒绝，需要登录' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);
        
        if (!user || !user.is_active) {
            return res.status(401).json({ message: '用户不存在或已被禁用' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Token验证失败:', error);
        return res.status(403).json({ message: 'Token无效或已过期' });
    }
};

// 可选认证中间件（token可选，但如果提供了就必须有效）
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);
        
        if (user && user.is_active) {
            req.user = user;
        }
        next();
    } catch (error) {
        // Token无效，但继续处理请求
        next();
    }
};

// VIP权限检查中间件
const requireVip = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: '需要登录' });
    }
    
    if (!req.user.isVip()) {
        return res.status(403).json({ 
            message: '此功能需要VIP会员权限',
            upgradeUrl: '/tech-pricing.html'
        });
    }
    
    next();
};

// 管理员权限检查中间件
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: '需要登录' });
    }
    
    if (!req.user.is_admin) {
        return res.status(403).json({ message: '需要管理员权限' });
    }
    
    next();
};

module.exports = {
    authenticateToken,
    optionalAuth,
    requireVip,
    requireAdmin
};



