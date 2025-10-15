const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Generation, User } = require('../models');

// 获取用户的所有生成记录
router.get('/generations', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const generations = await Generation.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']]
        });
        
        // 映射字段名以匹配前端期望的格式
        const formattedGenerations = generations.map(gen => ({
            id: gen.id,
            preview_url: gen.preview_image_url,  // 映射字段名给前端
            preview_image_url: gen.preview_image_url,
            high_quality_image_url: gen.high_quality_image_url,
            original_image_url: gen.original_image_url,
            status: gen.status,
            is_paid: gen.is_paid,
            created_at: gen.created_at,
            completed_at: gen.completed_at,
            generation_type: gen.generation_type,
            template_id: gen.template_id
        }));
        
        res.json({
            success: true,
            generations: formattedGenerations
        });
    } catch (error) {
        console.error('获取用户生成记录失败:', error);
        res.status(500).json({
            success: false,
            message: '获取生成记录失败'
        });
    }
});

// 获取用户统计信息
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 获取用户信息
        const user = await User.findByPk(userId);
        
        // 统计生成次数
        const totalGenerations = await Generation.count({
            where: { user_id: userId }
        });
        
        // 统计付费作品数量
        const paidGenerations = await Generation.count({
            where: { 
                user_id: userId,
                is_paid: true
            }
        });
        
        res.json({
            success: true,
            stats: {
                totalGenerations,
                paidGenerations,
                balance: user.balance || 0,
                pendingCommission: user.pending_commission || 0,
                totalCommission: user.total_commission || 0,
                freePreview: user.free_previews || 0,
                isVip: user.is_vip || false,
                vipExpiry: user.vip_expiry || null
            }
        });
    } catch (error) {
        console.error('获取用户统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取统计信息失败'
        });
    }
});

// 更新用户信息
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { email } = req.body;
        
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 更新邮箱
        if (email !== undefined) {
            user.email = email;
            await user.save();
        }
        
        res.json({
            success: true,
            message: '更新成功',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('更新用户信息失败:', error);
        res.status(500).json({
            success: false,
            message: '更新失败'
        });
    }
});

module.exports = router;







