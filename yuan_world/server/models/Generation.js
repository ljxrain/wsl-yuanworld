const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Generation = sequelize.define('Generation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    template_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Optional template ID for freestyle mode'
    },
    original_image_url: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: 'Path to the original uploaded image'
    },
    preview_image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Preview image path (watermarked)'
    },
    high_quality_image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'High quality image path (no watermark)'
    },
    original_image_path: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Path to the original, non-watermarked high-resolution image on the server'
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending',
        comment: 'Generation status'
    },
    generation_type: {
        type: DataTypes.ENUM('preview', 'high_quality'),
        allowNull: false,
        comment: 'Generation type (preview or high_quality)'
    },
    task_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Upstream LaoZhang task ID'
    },
    error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Error message'
    },
    processing_time: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Processing time in seconds'
    },
    is_paid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether the task was paid'
    },
    payment_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Payment amount'
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Completion time'
    }
}, {
    tableName: 'generations',
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['created_at']
        }
    ]
});

module.exports = Generation;




