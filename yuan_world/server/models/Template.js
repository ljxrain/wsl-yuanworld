const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Template = sequelize.define('Template', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '模板名称'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '模板描述'
    },
    category: {
        type: DataTypes.ENUM('life', 'couple', 'wedding', 'fashion', 'art'),
        allowNull: false,
        comment: '模板分类'
    },
    image_path: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: '模板图片路径（统一字段）'
    },
    thumbnail_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '缩略图地址（可选，兼容旧数据）'
    },
    preview_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '预览图地址（可选，兼容旧数据）'
    },
    idol_image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '偶像照片地址（可选，兼容旧数据）'
    },
    prompt: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '生图提示词'
    },
    laozhang_template_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        comment: '老张API中的模板ID（预留）'
    },
    is_vip_only: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否VIP专享'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: '是否启用'
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '排序权重'
    },
    usage_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '使用次数'
    },
    tags: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: '标签数组'
    }
}, {
    tableName: 'templates',
    indexes: [
        {
            fields: ['category']
        },
        {
            fields: ['is_active']
        },
        {
            fields: ['sort_order']
        }
    ]
});

// 实例方法：增加使用次数
Template.prototype.incrementUsage = async function() {
    this.usage_count += 1;
    await this.save();
};

module.exports = Template;



