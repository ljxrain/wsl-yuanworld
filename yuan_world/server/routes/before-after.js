const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// 配置文件上传
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }
});

// 案例数据文件路径
const CASES_FILE = path.join(__dirname, '../data/before-after-cases.json');

// 确保数据目录存在
async function ensureDataDir() {
    const dataDir = path.join(__dirname, '../data');
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// 读取案例数据
async function readCases() {
    try {
        const data = await fs.readFile(CASES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // 文件不存在时返回默认案例
        return [
            {
                title: '都市夜景',
                before_image: '/images/before.jpg',
                after_image: '/images/偶像图片/Generated Image October 03, 2025 - 10_18PM.png',
                sort_order: 10
            },
            {
                title: '浪漫婚纱',
                before_image: '/images/before.jpg',
                after_image: '/images/偶像图片/Generated Image October 03, 2025 - 11_04PM.png',
                sort_order: 20
            },
            {
                title: '时尚写真',
                before_image: '/images/before.jpg',
                after_image: '/images/偶像图片/Generated Image October 04, 2025 - 9_07AM (1).png',
                sort_order: 30
            }
        ];
    }
}

// 保存案例数据
async function saveCases(cases) {
    await ensureDataDir();
    await fs.writeFile(CASES_FILE, JSON.stringify(cases, null, 2), 'utf8');
}

// 获取所有案例 (公开)
router.get('/', async (req, res) => {
    try {
        const cases = await readCases();
        res.json(cases);
    } catch (error) {
        console.error('获取案例失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 保存所有案例 (仅管理员)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { cases } = req.body;
        
        if (!Array.isArray(cases)) {
            return res.status(400).json({ message: '案例数据格式错误' });
        }
        
        await saveCases(cases);
        console.log(`[Before-After] 管理员保存了 ${cases.length} 个案例`);
        
        res.json({ message: '保存成功', count: cases.length });
    } catch (error) {
        console.error('保存案例失败:', error);
        res.status(500).json({ message: '保存失败' });
    }
});

// 上传图片 (仅管理员)
router.post('/upload', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: '请选择图片文件' 
            });
        }
        
        const { type } = req.body; // 'before' or 'after'
        const oldPath = req.file.path;
        const newFileName = `${type}_${Date.now()}${path.extname(req.file.originalname)}`;
        const targetDir = path.join(__dirname, '../../public/images/before-after');
        
        // 确保目录存在
        try {
            await fs.access(targetDir);
        } catch {
            await fs.mkdir(targetDir, { recursive: true });
        }
        
        const newPath = path.join(targetDir, newFileName);
        await fs.rename(oldPath, newPath);
        
        const imageUrl = `/images/before-after/${newFileName}`;
        
        console.log(`[Before-After] ${type} image uploaded:`, imageUrl);
        
        res.json({
            success: true,
            message: '图片上传成功',
            imageUrl: imageUrl
        });
        
    } catch (error) {
        console.error('Upload image failed:', error);
        res.status(500).json({ 
            success: false,
            message: '图片上传失败：' + error.message 
        });
    }
});

module.exports = router;

