const User = require('./User');
const Generation = require('./Generation');
const Template = require('./Template');
const Order = require('./Order');
const Withdrawal = require('./Withdrawal');

// 定义模型关联关系
User.hasMany(Generation, {
    foreignKey: 'user_id',
    as: 'generations'
});

Generation.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

Generation.belongsTo(Template, {
    foreignKey: 'template_id',
    as: 'template'
});

Template.hasMany(Generation, {
    foreignKey: 'template_id',
    as: 'generations'
});

User.hasMany(Order, {
    foreignKey: 'user_id',
    as: 'orders'
});

Order.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'buyer'
});

User.hasMany(Withdrawal, {
    foreignKey: 'user_id',
    as: 'withdrawals'
});

Withdrawal.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

module.exports = {
    User,
    Generation,
    Template,
    Order,
    Withdrawal
};



