const express = require('express');
const { sequelize } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 获取所有用户列表（管理员）
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '', dateFrom, dateTo } = req.query;
        const offset = (page - 1) * limit;

        let dateFilter = '';
        const replacements = {
            search: `%${search}%`,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };

        if (dateFrom) {
            dateFilter += ' AND u.created_at >= :dateFrom';
            replacements.dateFrom = dateFrom;
        }
        if (dateTo) {
            dateFilter += ' AND u.created_at <= :dateTo';
            replacements.dateTo = dateTo;
        }

        const query = `
            SELECT 
                u.id,
                u.username,
                u.email,
                u.created_at as registration_time,
                u.last_login_at,
                u.is_active,
                u.is_admin,
                u.is_vip,
                u.vip_expiry,
                u.free_previews,
                u.balance,
                COUNT(DISTINCT g.id) FILTER (WHERE g.generation_type = 'preview') as preview_count,
                COUNT(DISTINCT g.id) FILTER (WHERE g.generation_type = 'paid' OR g.is_paid = true) as download_count,
                COUNT(DISTINCT g.id) as total_generations,
                COUNT(DISTINCT ll.id) as login_count,
                MAX(ll.login_time) as last_login_time
            FROM users u
            LEFT JOIN generations g ON u.id = g.user_id
            LEFT JOIN login_logs ll ON u.id = ll.user_id AND ll.login_success = true
            WHERE (u.username ILIKE :search OR u.email ILIKE :search)
            ${dateFilter}
            GROUP BY u.id, u.username, u.email, u.created_at, u.last_login_at, 
                     u.is_active, u.is_admin, u.is_vip, u.vip_expiry, u.free_previews, u.balance
            ORDER BY u.created_at DESC
            LIMIT :limit OFFSET :offset
        `;

        const countQuery = `
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            WHERE (u.username ILIKE :search OR u.email ILIKE :search)
            ${dateFilter}
        `;

        const [users] = await sequelize.query(query, { replacements });
        const [[{ total }]] = await sequelize.query(countQuery, { replacements });

        res.json({
            users,
            pagination: {
                total: parseInt(total),
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 获取单个用户详细信息（管理员）
router.get('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;

        // 获取用户基本信息
        const [[userInfo]] = await sequelize.query(
            `SELECT 
                u.id,
                u.username,
                u.email,
                u.created_at as registration_time,
                u.last_login_at,
                u.is_active,
                u.is_admin,
                u.is_vip,
                u.vip_expiry,
                u.free_previews,
                u.balance,
                u.subscription_type,
                COUNT(DISTINCT g.id) FILTER (WHERE g.generation_type = 'preview') as preview_count,
                COUNT(DISTINCT g.id) FILTER (WHERE g.generation_type = 'paid' OR g.is_paid = true) as download_count,
                COUNT(DISTINCT ll.id) as total_logins
            FROM users u
            LEFT JOIN generations g ON u.id = g.user_id
            LEFT JOIN login_logs ll ON u.id = ll.user_id AND ll.login_success = true
            WHERE u.id = :userId
            GROUP BY u.id`,
            { replacements: { userId } }
        );

        if (!userInfo) {
            return res.status(404).json({ message: '用户不存在' });
        }

        // 获取最近的预览记录
        const [previewRecords] = await sequelize.query(
            `SELECT 
                g.id,
                g.created_at,
                g.status,
                g.processing_time,
                t.name as template_name,
                t.id as template_id
            FROM generations g
            LEFT JOIN templates t ON g.template_id = t.id
            WHERE g.user_id = :userId AND g.generation_type = 'preview'
            ORDER BY g.created_at DESC
            LIMIT 20`,
            { replacements: { userId } }
        );

        // 获取最近的下载记录
        const [downloadRecords] = await sequelize.query(
            `SELECT 
                g.id,
                g.created_at,
                g.status,
                g.payment_amount,
                g.processing_time,
                t.name as template_name,
                t.id as template_id
            FROM generations g
            LEFT JOIN templates t ON g.template_id = t.id
            WHERE g.user_id = :userId AND (g.generation_type = 'paid' OR g.is_paid = true)
            ORDER BY g.created_at DESC
            LIMIT 20`,
            { replacements: { userId } }
        );

        // 获取登录记录
        const [loginRecords] = await sequelize.query(
            `SELECT 
                login_time,
                logout_time,
                session_duration,
                ip_address,
                user_agent
            FROM login_logs
            WHERE user_id = :userId AND login_success = true
            ORDER BY login_time DESC
            LIMIT 30`,
            { replacements: { userId } }
        );

        res.json({
            userInfo,
            previewRecords,
            downloadRecords,
            loginRecords
        });
    } catch (error) {
        console.error('获取用户详细信息错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 获取时间段内的注册统计
router.get('/registrations', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        
        const replacements = {};
        let dateFilter = '';
        
        if (dateFrom) {
            dateFilter += ' WHERE created_at >= :dateFrom';
            replacements.dateFrom = dateFrom;
        }
        if (dateTo) {
            dateFilter += (dateFilter ? ' AND' : ' WHERE') + ' created_at <= :dateTo';
            replacements.dateTo = dateTo;
        }

        const [results] = await sequelize.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM users
            ${dateFilter}
            GROUP BY DATE(created_at)
            ORDER BY date DESC`,
            { replacements }
        );

        res.json({ registrations: results });
    } catch (error) {
        console.error('获取注册统计错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 获取时间段内的登录统计
router.get('/logins', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        
        const replacements = {};
        let dateFilter = '';
        
        if (dateFrom) {
            dateFilter += ' WHERE login_time >= :dateFrom';
            replacements.dateFrom = dateFrom;
        }
        if (dateTo) {
            dateFilter += (dateFilter ? ' AND' : ' WHERE') + ' login_time <= :dateTo';
            replacements.dateTo = dateTo;
        }

        const [results] = await sequelize.query(
            `SELECT 
                DATE(login_time) as date,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(*) as total_logins
            FROM login_logs
            ${dateFilter}
            AND login_success = true
            GROUP BY DATE(login_time)
            ORDER BY date DESC`,
            { replacements }
        );

        res.json({ logins: results });
    } catch (error) {
        console.error('获取登录统计错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 获取用户在线时长统计
router.get('/online-duration', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId, dateFrom, dateTo } = req.query;
        
        const replacements = {};
        let filters = ['session_duration IS NOT NULL'];
        
        if (userId) {
            filters.push('user_id = :userId');
            replacements.userId = userId;
        }
        if (dateFrom) {
            filters.push('login_time >= :dateFrom');
            replacements.dateFrom = dateFrom;
        }
        if (dateTo) {
            filters.push('login_time <= :dateTo');
            replacements.dateTo = dateTo;
        }

        const whereClause = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';

        const [results] = await sequelize.query(
            `SELECT 
                username,
                DATE(login_time) as date,
                SUM(session_duration) as total_seconds,
                COUNT(*) as session_count
            FROM login_logs
            ${whereClause}
            GROUP BY username, DATE(login_time)
            ORDER BY date DESC, total_seconds DESC`,
            { replacements }
        );

        res.json({ onlineDuration: results });
    } catch (error) {
        console.error('获取在线时长错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 获取用户活动概览
router.get('/overview', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        
        const replacements = {};
        let userDateFilter = '';
        let genDateFilter = '';
        let loginDateFilter = '';
        
        if (dateFrom) {
            userDateFilter = ' WHERE created_at >= :dateFrom';
            genDateFilter = ' WHERE created_at >= :dateFrom';
            loginDateFilter = ' WHERE login_time >= :dateFrom';
            replacements.dateFrom = dateFrom;
        }
        if (dateTo) {
            const and = dateFrom ? ' AND' : ' WHERE';
            userDateFilter += and + ' created_at <= :dateTo';
            genDateFilter += and + ' created_at <= :dateTo';
            loginDateFilter += and + ' login_time <= :dateTo';
            replacements.dateTo = dateTo;
        }

        // 总注册用户数
        const [[{ total_users }]] = await sequelize.query(
            `SELECT COUNT(*) as total_users FROM users ${userDateFilter}`,
            { replacements }
        );

        // 活跃用户数（有登录记录的）
        const [[{ active_users }]] = await sequelize.query(
            `SELECT COUNT(DISTINCT user_id) as active_users 
             FROM login_logs ${loginDateFilter} AND login_success = true`,
            { replacements }
        );

        // 总预览次数
        const [[{ total_previews }]] = await sequelize.query(
            `SELECT COUNT(*) as total_previews 
             FROM generations ${genDateFilter} ${genDateFilter ? 'AND' : 'WHERE'} generation_type = 'preview'`,
            { replacements }
        );

        // 总下载次数
        const [[{ total_downloads }]] = await sequelize.query(
            `SELECT COUNT(*) as total_downloads 
             FROM generations ${genDateFilter} ${genDateFilter ? 'AND' : 'WHERE'} (generation_type = 'paid' OR is_paid = true)`,
            { replacements }
        );

        // 总登录次数
        const [[{ total_logins }]] = await sequelize.query(
            `SELECT COUNT(*) as total_logins 
             FROM login_logs ${loginDateFilter} AND login_success = true`,
            { replacements }
        );

        res.json({
            overview: {
                total_users: parseInt(total_users),
                active_users: parseInt(active_users),
                total_previews: parseInt(total_previews),
                total_downloads: parseInt(total_downloads),
                total_logins: parseInt(total_logins)
            }
        });
    } catch (error) {
        console.error('获取活动概览错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

module.exports = router;

