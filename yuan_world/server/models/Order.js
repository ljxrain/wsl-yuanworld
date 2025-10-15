const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    order_no: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        comment: '业务订单号'
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: '下单用户ID'
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: '实付金额'
    },
    status: {
        type: DataTypes.ENUM('pending', 'paid', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
        comment: '订单状态'
    },
    product_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'digital',
        comment: '产品类型'
    },
    product_id: {
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: '关联产品ID'
    },
    paid_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '支付时间'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '额外信息'
    }
}, {
    tableName: 'orders'
});

module.exports = Order;

