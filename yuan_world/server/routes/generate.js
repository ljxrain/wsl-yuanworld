const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const { authenticateToken } = require('../middleware/auth');
const { Generation, Template } = require('../models');

const router = express.Router();

const ensureDir = async (directory) => {
    await fs.mkdir(directory, { recursive: true });
};


const safeFileExtension = (mimetype, originalname) => {
    const mapping = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp'
    };
    const ext = mapping[mimetype] || (originalname ? path.extname(originalname).toLowerCase() : '');
    if (!ext || ext.length > 10) {
        return '.jpg';
    }
    return ext;
};

const generateUploadFileName = (file) => {
    const ext = safeFileExtension(file.mimetype, file.originalname);
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    return `${Date.now()}_${randomSuffix}${ext}`;
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/user_images');
        ensureDir(uploadDir)
            .then(() => cb(null, uploadDir))
            .catch((error) => cb(error));
    },
    filename: (req, file, cb) => {
        try {
            cb(null, generateUploadFileName(file));
        } catch (error) {
            cb(error);
        }
    }
});


const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, JPEG, PNG, or WEBP images are supported'), false);
        }
    }
});

class LaoZhangAPIService {
    constructor() {
        this.apiKey = process.env.LAOZHANG_API_KEY;
        this.apiURL = process.env.LAOZHANG_API_URL || 'https://api.laozhang.ai/v1/chat/completions';
    }

    async imageToBase64(imagePath) {
            const imageBuffer = await fs.readFile(imagePath);
        return imageBuffer.toString('base64');
    }

    async saveBase64Image(base64Data, savePath) {
        const buffer = Buffer.from(base64Data, 'base64');
        await fs.writeFile(savePath, buffer);
    }

    async submitGenerationTask(userImagePath, idolImageSource, prompt, type = 'preview') {
        try {
        const userImageBase64 = await this.imageToBase64(userImagePath);

            // 使用用户提供的原始prompt
            // 业务流程: 用户照片 + 明星照片 + 中文prompt -> 生成两人在一起的新照片
            const requestData = {
                model: "gemini-2.5-flash-image-preview",
            messages: [
                {
                        role: "user",
                    content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
                            image_url: {
                                    url: `data:image/jpeg;base64,${userImageBase64}`
                            }
                        },
                        {
                                type: "image_url",
                            image_url: {
                                    url: `data:image/jpeg;base64,${idolImageSource}`
                                }
                            }
                        ]
                    }
                ],
                stream: false,
                max_tokens: 4096
            };

            const response = await axios.post(
                this.apiURL,
                requestData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
                    },
                    timeout: 120000
                }
            );

            if (response.data && response.data.choices && response.data.choices[0]) {
                const content = response.data.choices[0].message.content;
                
                console.log('📦 AI返回完整响应结构:', JSON.stringify(response.data, null, 2).substring(0, 1000));
                console.log('📦 AI返回内容类型:', typeof content);
                console.log('📦 AI返回内容（前500字符）:', content ? content.substring(0, 500) : 'null');
                
                if (!content) {
                    throw new Error('AI返回的内容为空');
                }
                
                let imageBase64;
                
                // 情况1：content 是字符串
                if (typeof content === 'string') {
                    // 尝试匹配 data URL 格式: data:image/...;base64,xxxxx
                    const dataUrlMatch = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
                    if (dataUrlMatch) {
                        imageBase64 = dataUrlMatch[1];
                        console.log('✅ 识别为data URL格式，提取base64数据');
                    } 
                    // 尝试匹配纯base64格式（允许换行和空格）
                    else {
                        const cleanContent = content.replace(/[\s\n\r]/g, '');
                        if (cleanContent.match(/^[A-Za-z0-9+/]+=*$/)) {
                            imageBase64 = cleanContent;
                            console.log('✅ 识别为纯base64格式');
                        }
                    }
                }
                // 情况2：content 可能是对象（某些API返回结构化数据）
                else if (typeof content === 'object' && content !== null) {
                    console.log('📦 Content是对象，尝试提取图片数据...');
                    // 尝试从常见字段提取
                    imageBase64 = content.image || content.data || content.base64 || content.imageData;
                    if (imageBase64) {
                        console.log('✅ 从对象中提取到图片数据');
                    }
                }
                
                // 如果没有找到有效的图片数据
                if (!imageBase64) {
                    console.error('❌ 无法从返回内容中提取图片数据');
                    console.error('返回内容完整信息:', content);
                    throw new Error(`AI没有返回图片数据。API返回的是文本内容，可能是模型不支持图片生成，或prompt理解错误。请检查API配置或联系技术支持。返回内容: ${typeof content === 'string' ? content.substring(0, 200) : JSON.stringify(content).substring(0, 200)}`);
                }
                
                // 验证base64长度（图片至少应该有几KB）
                if (imageBase64.length < 1000) {
                    console.warn(`⚠️ 图片数据较小: ${imageBase64.length}字节`);
                    throw new Error(`AI返回的图片数据太小（${imageBase64.length}字节），可能不是有效图片`);
                }
                
                console.log(`✅ 成功提取图片数据，大小: ${imageBase64.length}字节`);
                return { imageBase64 };
            }

            console.error('❌ API响应结构无效:', JSON.stringify(response.data, null, 2));
            throw new Error('AI API返回了无效的响应结构');

        } catch (apiError) {
            console.error('LaoZhang API Error:', apiError.message);
            
            // 提取简洁的错误信息，避免包含大量数据
            let errorMessage = 'AI生成失败';
            if (apiError.response) {
                // API返回了错误
                if (apiError.response.data && apiError.response.data.message) {
                    errorMessage = apiError.response.data.message;
                } else if (apiError.response.data && apiError.response.data.error && apiError.response.data.error.message) {
                    errorMessage = apiError.response.data.error.message;
                } else {
                    errorMessage = `API错误: HTTP ${apiError.response.status}`;
                }
            } else if (apiError.request) {
                // 请求发出但没有收到响应
                errorMessage = '无法连接到AI服务，请稍后重试';
            } else {
                // 其他错误
                errorMessage = apiError.message || '生成过程出错';
            }
            
            throw new Error(errorMessage);
        }
    }
}

const laoZhangAPI = new LaoZhangAPIService();

const watermarkText = "源世界AI · 预览图";
const watermarkSvg = `
<svg width="400" height="150" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { fill: rgba(255,255,255,0.25); font-size: 28px; font-weight: bold; font-family: Arial, sans-serif; dominant-baseline: middle; text-anchor: middle; }
  </style>
  <text x="50%" y="50%" class="title">${watermarkText}</text>
</svg>
`;
const watermarkBuffer = Buffer.from(watermarkSvg);


const calculateProcessingSeconds = (modelInstance) => {
    const rawCreatedAt = modelInstance?.created_at ?? modelInstance?.createdAt;
    const createdDate = rawCreatedAt instanceof Date ? rawCreatedAt : (rawCreatedAt ? new Date(rawCreatedAt) : new Date());
    const createdTime = Number.isNaN(createdDate.getTime()) ? Date.now() : createdDate.getTime();
    return Math.max(0, Math.round((Date.now() - createdTime) / 1000));
};

async function resolveTemplateImageSource(template, field) {
    const rawValue = template[field];
    if (!rawValue) {
        throw new Error(`Template missing ${field}`);
    }

    const value = String(rawValue).trim();

    // case 1: data URL like: data:image/jpeg;base64,XXXX
    if (value.startsWith('data:')) {
        const commaIndex = value.indexOf(',');
        return commaIndex >= 0 ? value.slice(commaIndex + 1) : value;
    }

    // case 2: remote URL
    if (value.startsWith('http://') || value.startsWith('https://')) {
        const response = await axios.get(value, { responseType: 'arraybuffer' });
        return Buffer.from(response.data).toString('base64');
    }

    // case 3: local public path (supports with or without leading slash)
    if (value.startsWith('/') || value.match(/\.(png|jpe?g|webp)$/i)) {
        const relative = value.startsWith('/') ? value : `/${value}`;
        const imagePath = path.join(__dirname, '../../public', relative);
        return await laoZhangAPI.imageToBase64(imagePath);
    }

    // case 4: fallback - treat as already-base64 (avoid ENAMETOOLONG when mis-saved)
    return value;
}

router.get('/templates', async (req, res) => {
    try {
        const templates = await Template.findAll({
            where: { is_active: true },
            order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
            attributes: [
                'id', 'name', 'description', 'category',
                'image_path', 'thumbnail_url', 'preview_url', 'idol_image_url', 'prompt',
                'is_vip_only', 'usage_count', 'tags'
            ]
        });

        res.json({
            success: true,
            templates: templates.map(t => t.toJSON())
        });
    } catch (error) {
        console.error('Failed to load templates:', error);
        res.status(500).json({ message: 'Failed to load templates' });
    }
});

router.post(
    '/preview',
    authenticateToken,
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'idolImage', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            if (!req.files || !req.files.image || req.files.image.length === 0) {
                return res.status(400).json({ message: '请上传您的照片' });
            }

            const { templateId, prompt, mode } = req.body;
            const userImage = req.files.image[0];
            const idolImage = req.files.idolImage ? req.files.idolImage[0] : null;

            let template = null;
            let finalPrompt = null;
            let idolImageSource = null;
            const creationMode = templateId ? 'template' : 'freestyle';

            if (templateId) {
                template = await Template.findByPk(templateId);
                if (!template || !template.is_active) {
                    return res.status(404).json({ message: '模板不存在或已下架' });
                }

                // 暂时关闭VIP限制
                // if (template.is_vip_only && !req.user.isVip()) {
                //     return res.status(403).json({
                //         message: '该模板需要VIP会员',
                //         upgradeUrl: '/tech-pricing.html'
                //     });
                // }

                finalPrompt = template.prompt;
                // 生成用图应优先使用 idol_image_url（干净的参考图），缺失时再回退到展示用的 image_path
                const imageField = template.idol_image_url ? 'idol_image_url' : 'image_path';
                idolImageSource = await resolveTemplateImageSource(template, imageField);
                
                console.log(`[Template Mode] ID: ${templateId}, Name: ${template.name}`);
            } else {
                if (!prompt || !prompt.trim()) {
                    return res.status(400).json({ message: '请输入生图描述' });
                }
                if (!idolImage) {
                    return res.status(400).json({ message: '请上传偶像照片' });
                }

                finalPrompt = prompt.trim();
                idolImageSource = await laoZhangAPI.imageToBase64(idolImage.path);
                
                console.log(`[Freestyle Mode] Custom prompt: ${finalPrompt.substring(0, 50)}...`);
            }

            await req.user.resetDailyPreviews();
            
            const remainingPreviews = req.user.daily_preview_count;
            if (remainingPreviews <= 0) {
                return res.status(429).json({
                    message: '今日免费预览次数已用完',
                    remainingPreviews: 0
                });
            }

            // 记录开始时间
            const startTime = Date.now();

            const generation = await Generation.create({
                user_id: req.user.id,
                template_id: template ? template.id : null,
                original_image_url: `/uploads/user_images/${userImage.filename}`,
                generation_type: 'preview',
                status: 'processing'
            });

            console.log(`[Generation Start] User: ${req.user.email}, Mode: ${creationMode}, ID: ${generation.id}`);

            try {
                console.log(`[Calling API] User image: ${userImage.filename}, Prompt: ${finalPrompt.substring(0, 30)}...`);
                
                console.log('Submitting generation task...');
                const apiResult = await laoZhangAPI.submitGenerationTask(
                    userImage.path,
                    idolImageSource,
                    finalPrompt
                );
                console.log('API call successful, processing result...');
                
                const originalFileName = `${uuidv4()}.png`;
                const originalFilePath = path.join(__dirname, '../../public/images/generations/originals', originalFileName);
                await ensureDir(path.dirname(originalFilePath));
                await laoZhangAPI.saveBase64Image(apiResult.imageBase64, originalFilePath);

                const previewFileName = `${uuidv4()}.jpg`;
                const previewFilePath = path.join(__dirname, '../../public/images/generations/previews', previewFileName);
                await ensureDir(path.dirname(previewFilePath));

                await sharp(originalFilePath)
                    .composite([{
                        input: watermarkBuffer,
                        tile: true,
                        blend: 'over'
                    }])
                    .jpeg({ quality: 90 })
                    .toFile(previewFilePath);

                const previewImageUrl = `/images/generations/previews/${previewFileName}`;

                // 计算生成耗时（秒）
                const processingTime = Math.round((Date.now() - startTime) / 1000);

                generation.status = 'completed';
                generation.completed_at = new Date();
                generation.preview_image_url = previewImageUrl;
                generation.original_image_path = originalFilePath;
                generation.processing_time = processingTime;
                await generation.save();

                if (template) {
                    await template.incrementUsage();
                }

                // 扣除预览次数（这个方法内部会调用save）
                await req.user.usePreview();

                // 更新生成次数
                req.user.total_generations += 1;
                await req.user.save();

                // 重新加载用户数据以获取最新的预览次数
                await req.user.reload();

                console.log(`[Generation Complete] ID: ${generation.id}, Time: ${processingTime}s, Mode: ${creationMode}, Remaining: ${req.user.daily_preview_count}`);

                res.json({
                    success: true,
                    message: '预览图生成成功',
                    imageUrl: previewImageUrl,
                    previewImageUrl: previewImageUrl,
                    originalImageUrl: `/images/generations/originals/${originalFileName}`,
                    generationId: generation.id,
                    remainingPreviews: req.user.daily_preview_count,
                    processingTime: processingTime
                });
            } catch (apiError) {
                console.error('LaoZhang API Error:', apiError.message);
                
                let errorMessage = 'AI生成失败';
                if (apiError.response) {
                    if (apiError.response.data && apiError.response.data.message) {
                        errorMessage = apiError.response.data.message;
                    } else if (apiError.response.data && apiError.response.data.error && apiError.response.data.error.message) {
                        errorMessage = apiError.response.data.error.message;
                    } else {
                        errorMessage = `API错误: HTTP ${apiError.response.status}`;
                    }
                } else if (apiError.request) {
                    // 请求发出但没有收到响应
                    errorMessage = '无法连接到AI服务，请稍后重试';
                } else {
                    // 其他错误
                    errorMessage = apiError.message || '生成过程出错';
                }
                
                generation.status = 'failed';
                generation.error_message = errorMessage;
                await generation.save();

                req.user.daily_preview_count += 1;
                await req.user.save();

                console.error('API Call Failed:', apiError.message);
                
                // 只返回简洁的错误信息，不包含详细的stack
                res.status(500).json({ 
                    success: false,
                    message: errorMessage || '预览生成失败'
                });
            }
        } catch (error) {
            console.error('Preview Generation Failed:', error.message);
            
            // 只返回简洁的错误信息
            res.status(500).json({ 
                success: false,
                message: error.message || '预览生成失败'
            });
        }
    }
);

router.post('/high-quality', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image file' });
        }

        const { templateId, prompt } = req.body;
        if (!templateId) {
            return res.status(400).json({ message: 'Please select a template' });
        }

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ message: 'Please enter a description' });
        }

        const generation = await Generation.create({
            user_id: req.user.id,
            template_id: templateId,
            original_image_url: `/uploads/user_images/${req.file.filename}`,
            generation_type: 'high_quality',
            status: 'processing'
        });

            res.json({
            success: true,
            message: 'High-quality generation started',
            generationId: generation.id
        });

    } catch (error) {
        console.error('High-quality generation failed:', error);
        res.status(500).json({ message: 'Failed to start generation' });
    }
});

router.get('/status/:generationId', authenticateToken, async (req, res) => {
    try {
        const generation = await Generation.findOne({
            where: {
                id: req.params.generationId,
                user_id: req.user.id
                }
        });

        if (!generation) {
            return res.status(404).json({ message: 'Generation not found' });
        }

        res.json({
            success: true,
            generation: generation.toJSON()
        });
    } catch (error) {
        console.error('Failed to get generation status:', error);
        res.status(500).json({ message: 'Failed to get status' });
    }
});

router.get('/history', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { count, rows } = await Generation.findAndCountAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
            limit,
            offset,
            include: [{
                model: Template,
                as: 'template',
                attributes: ['id', 'name', 'thumbnail_url']
            }]
        });

        res.json({
            success: true,
            generations: rows.map(g => g.toJSON()),
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Failed to load generation history:', error);
        res.status(500).json({ message: 'Failed to load generation history' });
    }
});

router.post('/upload-idol-image', upload.single('idolImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: '请选择图片文件' 
            });
        }
        
        const oldPath = req.file.path;
        const newFileName = `idol_${Date.now()}${path.extname(req.file.originalname)}`;
        const newPath = path.join(__dirname, '../../public/images/idols', newFileName);
        
        await fs.rename(oldPath, newPath);
        
        const imageUrl = `/images/idols/${newFileName}`;
        
        console.log('Idol image uploaded:', imageUrl);
        
        res.json({
            success: true,
            message: '图片上传成功',
            imageUrl: imageUrl
        });
        
    } catch (error) {
        console.error('Upload idol image failed:', error);
        res.status(500).json({ 
            success: false,
            message: '图片上传失败：' + error.message 
        });
    }
});

router.put('/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { prompt, idol_image_url } = req.body;
        
        console.log(`Update template ID: ${id}`);
        console.log('  - Prompt:', prompt ? prompt.substring(0, 50) + '...' : 'Not provided');
        console.log('  - Idol image:', idol_image_url || 'Not provided');
        
        const template = await Template.findByPk(id);
        
        if (!template) {
            return res.status(404).json({ message: '模板不存在' });
        }
        
        if (prompt !== undefined) {
            template.prompt = prompt;
        }
        if (idol_image_url !== undefined) {
            template.idol_image_url = idol_image_url;
        }
        
        await template.save();
        
        console.log('Template updated successfully');
        res.json({
            success: true,
            message: '模板更新成功',
            template: {
                id: template.id,
                name: template.name,
                prompt: template.prompt,
                idol_image_url: template.idol_image_url
            }
        });
        
    } catch (error) {
        console.error('Update template failed:', error);
        res.status(500).json({ 
            success: false,
            message: '更新模板失败：' + error.message 
        });
    }
});

module.exports = router;

