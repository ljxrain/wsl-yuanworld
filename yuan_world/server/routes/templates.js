const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// 获取所有模板 (公开)
router.get('/', async (req, res) => {
    try {
        const templates = await Template.findAll({
            order: [['sort_order', 'ASC'], ['id', 'ASC']]
        });
        res.json(templates);
    } catch (error) {
        console.error('获取模板失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 创建新模板 (仅管理员)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, category, image_path, prompt, idol_image_url, sort_order } = req.body;
        const newTemplate = await Template.create({
            name,
            category,
            image_path,
            prompt,
            idol_image_url,
            sort_order: sort_order || 100
        });
        res.status(201).json(newTemplate);
    } catch (error) {
        console.error('创建模板失败:', error);
        res.status(500).json({ message: '创建模板失败' });
    }
});

// 更新模板 (仅管理员)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, image_path, prompt, idol_image_url, sort_order } = req.body;
        const template = await Template.findByPk(id);
        if (!template) {
            return res.status(404).json({ message: '模板不存在' });
        }
        // 基本校验：名称/分类/路径
        if (!name || !category || !image_path) {
            return res.status(400).json({ message: '缺少必要字段（name/category/image_path）' });
        }

        await template.update({ name, category, image_path, prompt, idol_image_url, sort_order });
        console.log(`[Template Update] id=${id} name=${name} idol_image_url=${idol_image_url || 'null'}`);
        res.json(template);
    } catch (error) {
        console.error('更新模板失败:', error);
        res.status(500).json({ message: '更新模板失败' });
    }
});

// 获取单个模板（便于保存后校验）
router.get('/:id', async (req, res) => {
    try {
        const template = await Template.findByPk(req.params.id);
        if (!template) return res.status(404).json({ message: '模板不存在' });
        res.json(template);
    } catch (error) {
        console.error('获取模板失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 删除单个模板 (仅管理员)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const template = await Template.findByPk(id);
        if (!template) {
            return res.status(404).json({ message: '模板不存在' });
        }
        await template.destroy();
        console.log(`[Template Delete] 已删除模板 ID=${id}, Name=${template.name}`);
        res.json({ message: '删除成功', id });
    } catch (error) {
        console.error('删除模板失败:', error);
        res.status(500).json({ message: '删除模板失败' });
    }
});

// 删除所有模板 (仅管理员)
router.delete('/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const count = await Template.count();
        await Template.destroy({ where: {} });
        res.json({ message: `成功删除 ${count} 个模板` });
    } catch (error) {
        console.error('删除模板失败:', error);
        res.status(500).json({ message: '删除模板失败' });
    }
});


module.exports = router;
