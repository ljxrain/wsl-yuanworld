const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Generation, User } = require('../models');
const { Op } = require('sequelize');

// 管理员权限验证中间件
const requireAdmin = (req, res, next) => {
    // TODO: 实现真正的管理员权限验证
    // 暂时允许所有登录用户访问
    if (!req.user) {
        return res.status(403).json({
            success: false,
            message: '需要管理员权限'
        });
    }
    next();
};

// 获取统计数据
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // 总用户数
        const totalUsers = await User.count();
        
        // 今日新增用户
        const newUsersToday = await User.count({
            where: {
                created_at: {
                    [Op.gte]: today
                }
            }
        });
        
        // 总生成次数
        const totalGenerations = await Generation.count();
        
        // 今日生成次数
        const generationsToday = await Generation.count({
            where: {
                created_at: {
                    [Op.gte]: today
                }
            }
        });
        
        // VIP用户数（模拟数据）
        const vipUsers = await User.count({
            where: {
                is_vip: true
            }
        });
        
        // 本月新增VIP（模拟数据）
        const vipThisMonth = 0;
        
        // 总收入和今日收入（模拟数据）
        const totalRevenue = 0;
        const revenueToday = 0;
        
        res.json({
            success: true,
            totalUsers,
            newUsersToday,
            totalRevenue,
            revenueToday,
            totalGenerations,
            generationsToday,
            vipUsers,
            vipThisMonth
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取统计数据失败'
        });
    }
});

// 获取用户列表
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '' } = req.query;
        const offset = (page - 1) * limit;
        
        const where = search ? {
            [Op.or]: [
                { username: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ]
        } : {};
        
        const { count, rows } = await User.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']],
            attributes: ['id', 'username', 'email', 'balance', 'free_previews', 'is_vip', 'vip_expiry', 'created_at']
        });
        
        res.json({
            success: true,
            users: rows,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败'
        });
    }
});

// 获取生成记录列表
router.get('/generations', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;
        
        const { count, rows } = await Generation.findAndCountAll({
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']],
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username']
            }]
        });
        
        res.json({
            success: true,
            generations: rows,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('获取生成记录失败:', error);
        res.status(500).json({
            success: false,
            message: '获取生成记录失败'
        });
    }
});

// 获取订单列表（暂时返回空数据）
router.get('/orders', authenticateToken, requireAdmin, async (req, res) => {
    try {
        res.json({
            success: true,
            orders: [],
            total: 0,
            page: 1,
            totalPages: 0
        });
    } catch (error) {
        console.error('获取订单列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取订单列表失败'
        });
    }
});

// 更新用户信息
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { balance, free_previews, is_vip } = req.body;
        
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        if (balance !== undefined) user.balance = balance;
        if (free_previews !== undefined) user.free_previews = free_previews;
        if (is_vip !== undefined) user.is_vip = is_vip;
        
        await user.save();
        
        res.json({
            success: true,
            message: '更新成功',
            user
        });
    } catch (error) {
        console.error('更新用户失败:', error);
        res.status(500).json({
            success: false,
            message: '更新用户失败'
        });
    }
});

module.exports = router;










