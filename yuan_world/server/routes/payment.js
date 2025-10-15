const express = require('express');

const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { User } = require('../models');
const { sequelize } = require('../config/database');

/**
 * Payment module placeholder.
 * Integrate actual gateways (WeChat Pay, Alipay, etc.) where marked.
 */

// Create recharge order (placeholder)
router.post('/recharge', authenticateToken, async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid recharge amount'
            });
        }

        // TODO: create recharge order and return gateway parameters
        return res.json({
            success: false,
            message: 'Payment channel not integrated yet',
            data: {
                orderId: `ORDER_${Date.now()}`,
                amount,
                status: 'pending'
            }
        });
    } catch (error) {
        console.error('Create recharge order failed:', error);
        return res.status(500).json({
            success: false,
            message: 'Create recharge order failed'
        });
    }
});

// Purchase VIP (placeholder)
router.post('/vip/purchase', authenticateToken, async (req, res) => {
    try {
        const { months, amount } = req.body;

        if (!months || Number(months) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid VIP duration'
            });
        }

        // TODO: create VIP order and call payment gateway
        return res.json({
            success: false,
            message: 'Payment channel not integrated yet',
            data: {
                orderId: `VIP_${Date.now()}`,
                months,
                amount,
                status: 'pending'
            }
        });
    } catch (error) {
        console.error('Purchase VIP failed:', error);
        return res.status(500).json({
            success: false,
            message: 'Purchase VIP failed'
        });
    }
});

// Download high resolution (placeholder)
router.post('/download', authenticateToken, async (req, res) => {
    try {
        const { generationId } = req.body;

        if (!generationId) {
            return res.status(400).json({
                success: false,
                message: 'Missing generation id'
            });
        }

        // TODO: add payment logic or balance deduction
        return res.json({
            success: false,
            message: 'Payment channel not integrated yet',
            data: {
                orderId: `DOWNLOAD_${Date.now()}`,
                generationId,
                price: 5,
                status: 'pending'
            }
        });
    } catch (error) {
        console.error('Purchase HD download failed:', error);
        return res.status(500).json({
            success: false,
            message: 'Purchase download failed'
        });
    }
});

// Balance payment (simplified - no commission)
router.post('/balance/pay', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, type, itemId } = req.body;

        const numericAmount = Number(amount);
        if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        const txn = await sequelize.transaction();
        try {
            const user = await User.findByPk(userId, { transaction: txn });
            if (!user) {
                await txn.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (Number(user.balance) < numericAmount) {
                await txn.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient balance'
                });
            }

            // Deduct balance
            await user.decrement('balance', { by: numericAmount, transaction: txn });

            await txn.commit();

            const refreshedUser = await User.findByPk(userId);

            return res.json({
                success: true,
                message: 'Payment success',
                balance: refreshedUser ? refreshedUser.balance : null
            });
        } catch (innerError) {
            await txn.rollback();
            throw innerError;
        }
    } catch (error) {
        console.error('Balance payment failed:', error);
        return res.status(500).json({
            success: false,
            message: 'Balance payment failed'
        });
    }
});

// Simulate a paid order (testing helper - simplified)
router.post('/orders/simulate', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount } = req.body;

        const numericAmount = Number(amount);
        if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        // Simplified simulation - just add balance
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await user.increment('balance', { by: numericAmount });

        return res.status(201).json({
            success: true,
            message: 'Simulated payment success',
            balance: Number(user.balance) + numericAmount
        });
    } catch (error) {
        console.error('Simulated order failed:', error);
        return res.status(500).json({
            success: false,
            message: 'Simulated order failed'
        });
    }
});

module.exports = router;


