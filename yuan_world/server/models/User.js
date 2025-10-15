const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            len: [2, 50],
            notEmpty: true
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: false, // 允许为空，不强制唯一
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: [6, 255],
            notEmpty: true
        }
    },
    avatar: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    subscription_type: {
        type: DataTypes.ENUM('free', 'monthly', 'yearly'),
        defaultValue: 'free'
    },
    subscription_expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    daily_preview_count: {
        type: DataTypes.INTEGER,
        defaultValue: 30
    },
    daily_preview_reset_date: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    total_generations: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    last_login_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    is_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    balance: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: '账户余额'
    },
    free_previews: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
        comment: '剩余免费预览次数'
    },
    is_vip: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'VIP状态'
    },
    vip_expiry: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'VIP到期时间'
    },
    vip_level: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'VIP等级: 0=普通, 1=月卡, 2=季卡, 3=年卡'
    }
}, {
    tableName: 'users',
    hooks: {
        // 密码加密
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// 实例方法：验证密码
User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// 实例方法：检查是否是VIP用户
User.prototype.isVip = function() {
    if (this.subscription_type === 'free') return false;
    if (!this.subscription_expires_at) return false;
    return new Date() < this.subscription_expires_at;
};

// 实例方法：重置每日预览次数
User.prototype.resetDailyPreviews = async function() {
    const today = new Date().toISOString().split('T')[0];
    let resetDate = null;

    if (this.daily_preview_reset_date) {
        if (typeof this.daily_preview_reset_date === 'string') {
            resetDate = this.daily_preview_reset_date.split('T')[0];
        } else if (this.daily_preview_reset_date instanceof Date) {
            resetDate = this.daily_preview_reset_date.toISOString().split('T')[0];
        }
    }

    if (resetDate !== today) {
        this.daily_preview_count = this.isVip() ? 99999 : 30;
        this.daily_preview_reset_date = today;
        await this.save();
    }
};

// 实例方法：使用预览次数
User.prototype.usePreview = async function() {
    await this.resetDailyPreviews();
    
    if (this.daily_preview_count > 0) {
        this.daily_preview_count -= 1;
        await this.save();
        return true;
    }
    return false;
};

// 实例方法：获取用户安全信息（去除密码）
User.prototype.toSafeObject = function() {
    const { password, ...safeUser } = this.toJSON();
    return safeUser;
};

module.exports = User;
