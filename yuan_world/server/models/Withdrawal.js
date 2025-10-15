const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Withdrawal = sequelize.define('Withdrawal', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: '提现用户ID'
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: '提现金额'
    },
    fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: '提现手续费'
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'paid', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
        comment: '提现状态'
    },
    transfer_channel: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '打款渠道'
    },
    transfer_ref: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '打款参考号'
    },
    processed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: '处理管理员ID'
    },
    processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '处理时间'
    },
    notes: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '备注'
    }
}, {
    tableName: 'withdrawals'
});

module.exports = Withdrawal;

