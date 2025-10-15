const express = require('express');
const { Op } = require('sequelize');
const { User, Generation, Template } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 获取网站整体统计数据（公开接口）
router.get('/public', async (req, res) => {
    try {
        const [
            totalUsers,
            totalGenerations,
            activeUsers,
            popularTemplates
        ] = await Promise.all([
            // 总用户数
            User.count({ where: { is_active: true } }),
            
            // 总生成次数
            Generation.count({ where: { status: 'completed' } }),
            
            // 活跃用户数（最近30天有生成记录）
            User.count({
                include: [{
                    model: Generation,
                    as: 'generations',
                    where: {
                        created_at: {
                            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
                    },
                    required: true
                }]
            }),
            
            // 最受欢迎的模板（前3个）
            Template.findAll({
                where: { is_active: true },
                order: [['usage_count', 'DESC']],
                limit: 3,
                attributes: ['id', 'name', 'category', 'usage_count']
            })
        ]);

        res.json({
            totalUsers,
            totalGenerations,
            activeUsers,
            popularTemplates,
            // 固定的展示数据
            userSatisfaction: 99.2,
            avgProcessingTime: 28
        });

    } catch (error) {
        console.error('获取公开统计失败:', error);
        res.status(500).json({ message: '获取统计数据失败' });
    }
});

// 获取用户个人统计（需要登录）
router.get('/personal', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

        const [
            totalGenerations,
            monthlyGenerations,
            weeklyGenerations,
            todayGenerations,
            favoriteCategory,
            recentGenerations
        ] = await Promise.all([
            // 总生成次数
            Generation.count({
                where: {
                    user_id: userId,
                    status: 'completed'
                }
            }),
            
            // 本月生成次数
            Generation.count({
                where: {
                    user_id: userId,
                    status: 'completed',
                    created_at: {
                        [Op.gte]: thirtyDaysAgo
                    }
                }
            }),
            
            // 本周生成次数
            Generation.count({
                where: {
                    user_id: userId,
                    status: 'completed',
                    created_at: {
                        [Op.gte]: sevenDaysAgo
                    }
                }
            }),
            
            // 今日生成次数
            Generation.count({
                where: {
                    user_id: userId,
                    status: 'completed',
                    created_at: {
                        [Op.gte]: new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    }
                }
            }),
            
            // 最喜欢的模板类别
            Generation.findAll({
                where: {
                    user_id: userId,
                    status: 'completed'
                },
                include: [{
                    model: Template,
                    as: 'template',
                    attributes: ['category']
                }],
                attributes: ['template_id'],
                group: ['template.category', 'template.id'],
                raw: true
            }).then(results => {
                const categoryCount = {};
                results.forEach(result => {
                    const category = result['template.category'];
                    if (category) {
                        categoryCount[category] = (categoryCount[category] || 0) + 1;
                    }
                });
                
                let maxCategory = null;
                let maxCount = 0;
                for (const [category, count] of Object.entries(categoryCount)) {
                    if (count > maxCount) {
                        maxCount = count;
                        maxCategory = category;
                    }
                }
                
                return { category: maxCategory, count: maxCount };
            }),
            
            // 最近的生成记录
            Generation.findAll({
                where: { user_id: userId },
                include: [{
                    model: Template,
                    as: 'template',
                    attributes: ['name', 'category']
                }],
                order: [['created_at', 'DESC']],
                limit: 10,
                attributes: ['id', 'status', 'generation_type', 'created_at', 'completed_at']
            })
        ]);

        res.json({
            totalGenerations,
            monthlyGenerations,
            weeklyGenerations,
            todayGenerations,
            favoriteCategory,
            remainingPreviews: req.user.daily_preview_count,
            isVip: req.user.isVip(),
            subscriptionType: req.user.subscription_type,
            subscriptionExpiresAt: req.user.subscription_expires_at,
            memberSince: req.user.created_at,
            recentGenerations: recentGenerations.map(gen => ({
                id: gen.id,
                status: gen.status,
                type: gen.generation_type,
                template: gen.template ? {
                    name: gen.template.name,
                    category: gen.template.category
                } : null,
                createdAt: gen.created_at,
                completedAt: gen.completed_at
            }))
        });

    } catch (error) {
        console.error('获取个人统计失败:', error);
        res.status(500).json({ message: '获取个人统计失败' });
    }
});

// 管理员统计面板（需要管理员权限）
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { period = '30' } = req.query; // 默认30天
        const days = parseInt(period);
        const periodStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [
            userStats,
            generationStats,
            templateStats,
            revenueStats,
            systemStats
        ] = await Promise.all([
            // 用户统计
            Promise.all([
                User.count({ where: { is_active: true } }),
                User.count({ 
                    where: { 
                        created_at: { [Op.gte]: periodStart }
                    }
                }),
                User.count({ 
                    where: { 
                        subscription_type: { [Op.ne]: 'free' },
                        subscription_expires_at: { [Op.gt]: new Date() }
                    }
                })
            ]).then(([total, newUsers, vipUsers]) => ({
                total,
                newUsers,
                vipUsers,
                vipRate: total > 0 ? ((vipUsers / total) * 100).toFixed(1) : 0
            })),
            
            // 生成统计
            Promise.all([
                Generation.count(),
                Generation.count({ 
                    where: { 
                        created_at: { [Op.gte]: periodStart }
                    }
                }),
                Generation.count({ 
                    where: { status: 'completed' }
                }),
                Generation.count({ 
                    where: { status: 'failed' }
                })
            ]).then(([total, recent, completed, failed]) => ({
                total,
                recent,
                completed,
                failed,
                successRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0
            })),
            
            // 模板统计
            Template.findAll({
                include: [{
                    model: Generation,
                    as: 'generations',
                    where: {
                        created_at: { [Op.gte]: periodStart },
                        status: 'completed'
                    },
                    required: false
                }],
                order: [['usage_count', 'DESC']],
                limit: 10,
                attributes: ['id', 'name', 'category', 'usage_count', 'is_vip_only']
            }),
            
            // 收入统计（如果有支付功能）
            Generation.findAll({
                where: {
                    is_paid: true,
                    created_at: { [Op.gte]: periodStart }
                },
                attributes: ['payment_amount', 'created_at']
            }).then(paidGenerations => {
                const totalRevenue = paidGenerations.reduce((sum, gen) => 
                    sum + parseFloat(gen.payment_amount || 0), 0);
                const avgOrderValue = paidGenerations.length > 0 ? 
                    totalRevenue / paidGenerations.length : 0;
                
                return {
                    totalRevenue: totalRevenue.toFixed(2),
                    paidOrders: paidGenerations.length,
                    avgOrderValue: avgOrderValue.toFixed(2)
                };
            }),
            
            // 系统统计
            Promise.all([
                Generation.findAll({
                    where: {
                        created_at: { [Op.gte]: periodStart },
                        processing_time: { [Op.ne]: null }
                    },
                    attributes: ['processing_time']
                }).then(results => {
                    if (results.length === 0) return 0;
                    const totalTime = results.reduce((sum, gen) => sum + gen.processing_time, 0);
                    return (totalTime / results.length).toFixed(1);
                })
            ]).then(([avgProcessingTime]) => ({
                avgProcessingTime
            }))
        ]);

        res.json({
            period: days,
            users: userStats,
            generations: generationStats,
            templates: templateStats.map(template => ({
                id: template.id,
                name: template.name,
                category: template.category,
                usageCount: template.usage_count,
                isVipOnly: template.is_vip_only,
                recentUsage: template.generations ? template.generations.length : 0
            })),
            revenue: revenueStats,
            system: systemStats
        });

    } catch (error) {
        console.error('获取管理员统计失败:', error);
        res.status(500).json({ message: '获取管理员统计失败' });
    }
});

// 获取用户增长趋势
router.get('/growth', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const numDays = parseInt(days);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - numDays);

        const dailyStats = [];
        
        for (let i = 0; i < numDays; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const nextDate = new Date(currentDate);
            nextDate.setDate(currentDate.getDate() + 1);

            const [newUsers, newGenerations] = await Promise.all([
                User.count({
                    where: {
                        created_at: {
                            [Op.gte]: currentDate,
                            [Op.lt]: nextDate
                        }
                    }
                }),
                Generation.count({
                    where: {
                        created_at: {
                            [Op.gte]: currentDate,
                            [Op.lt]: nextDate
                        }
                    }
                })
            ]);

            dailyStats.push({
                date: currentDate.toISOString().split('T')[0],
                newUsers,
                newGenerations
            });
        }

        res.json({ dailyStats });

    } catch (error) {
        console.error('获取增长趋势失败:', error);
        res.status(500).json({ message: '获取增长趋势失败' });
    }
});

module.exports = router;



