const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { Op } = require('sequelize');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 输入验证schemas
const registerSchema = Joi.object({
    username: Joi.string().min(2).max(50).required().messages({
        'string.min': '用户名至少2个字符',
        'string.max': '用户名最多50个字符',
        'any.required': '用户名为必填项'
    }),
    email: Joi.string().email().allow('').optional().messages({
        'string.email': '请输入有效的邮箱地址'
    }),
    password: Joi.string().min(6).max(255).required().messages({
        'string.min': '密码至少6个字符',
        'string.max': '密码最多255个字符',
        'any.required': '密码为必填项'
    })
});

const loginSchema = Joi.object({
    identifier: Joi.string().required().messages({
        'any.required': '请输入用户名或邮箱'
    }),
    password: Joi.string().required().messages({
        'any.required': '密码为必填项'
    })
});

// 生成JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// 用户注册
router.post('/register', async (req, res) => {
    try {
        // 验证输入
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: '输入验证失败',
                details: error.details.map(d => d.message)
            });
        }

        const { username, email, password } = value;

        // 检查用户名是否已存在
        const existingUser = await User.findOne({
            where: { username }
        });

        if (existingUser) {
            return res.status(409).json({
                message: '用户名已被使用'
            });
        }

        // 如果提供了邮箱，检查邮箱是否已被注册
        if (email && email.trim()) {
            const existingEmail = await User.findOne({
                where: { email }
            });

            if (existingEmail) {
                return res.status(409).json({
                    message: '邮箱已被注册'
                });
            }
        }

        // 创建新用户
        const user = await User.create({
            username,
            email,
            password
        });

        // 生成token
        const token = generateToken(user.id);

        res.status(201).json({
            message: '注册成功',
            user: user.toSafeObject(),
            token
        });

    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 用户登录
router.post('/login', async (req, res) => {
    try {
        // 验证输入
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: '输入验证失败',
                details: error.details.map(d => d.message)
            });
        }

        const { identifier, password } = value;

        // 查找用户（支持用户名或邮箱登录）
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { username: identifier },
                    { email: identifier }
                ]
            }
        });
        
        if (!user) {
            return res.status(401).json({ message: '用户名/邮箱或密码错误' });
        }

        // 验证密码
        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ message: '用户名/邮箱或密码错误' });
        }

        // 检查用户是否被禁用
        if (!user.is_active) {
            return res.status(401).json({ message: '账户已被禁用，请联系客服' });
        }

        // 更新最后登录时间
        user.last_login_at = new Date();
        await user.save();

        // 生成token
        const token = generateToken(user.id);

        res.json({
            message: '登录成功',
            user: user.toSafeObject(),
            token
        });

    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 获取用户信息
router.get('/me', authenticateToken, async (req, res) => {
    try {
        // 重置每日预览次数
        await req.user.resetDailyPreviews();
        
        res.json({
            user: req.user.toSafeObject()
        });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 更新用户信息
router.put('/me', authenticateToken, async (req, res) => {
    try {
        const updateSchema = Joi.object({
            username: Joi.string().min(2).max(50),
            avatar: Joi.string().uri()
        }).min(1);

        const { error, value } = updateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: '输入验证失败',
                details: error.details.map(d => d.message)
            });
        }

        // 如果更新用户名，检查是否重复
        if (value.username) {
            const existingUser = await User.findOne({
                where: {
                    username: value.username,
                    id: { [Op.ne]: req.user.id }
                }
            });

            if (existingUser) {
                return res.status(409).json({ message: '用户名已被使用' });
            }
        }

        // 更新用户信息
        await req.user.update(value);

        res.json({
            message: '更新成功',
            user: req.user.toSafeObject()
        });

    } catch (error) {
        console.error('更新用户信息错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 修改密码
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const changePasswordSchema = Joi.object({
            currentPassword: Joi.string().required().messages({
                'any.required': '当前密码为必填项'
            }),
            newPassword: Joi.string().min(6).max(255).required().messages({
                'string.min': '新密码至少6个字符',
                'string.max': '新密码最多255个字符',
                'any.required': '新密码为必填项'
            })
        });

        const { error, value } = changePasswordSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: '输入验证失败',
                details: error.details.map(d => d.message)
            });
        }

        const { currentPassword, newPassword } = value;

        // 验证当前密码
        const isValidPassword = await req.user.validatePassword(currentPassword);
        if (!isValidPassword) {
            return res.status(401).json({ message: '当前密码错误' });
        }

        // 更新密码
        req.user.password = newPassword;
        await req.user.save();

        res.json({ message: '密码修改成功' });

    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// Token验证接口
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: req.user.toSafeObject()
    });
});

module.exports = router;
