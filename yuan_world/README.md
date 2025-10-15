# 源世界 - AI生图网站

一个完整的AI人脸融合生图网站，包含用户系统、模板管理、支付功能等完整生产级功能。

## 🌟 主要功能

### 用户端
- ✨ 精美的前端界面设计（PC/移动端自适应）
- 👤 完整的用户注册/登录系统
- 📱 多种模板分类（日常、情侣、婚纱、时尚、艺术）
- 🎯 AI图片生成（预览版和高清版）
- 💳 支付集成准备（微信/支付宝）
- 📊 个人使用统计面板

### 管理端
- 📈 完整的统计分析系统
- 👥 用户管理功能
- 🖼️ 模板管理系统
- 💰 收入统计分析

### 技术特性
- 🚀 Node.js + Express 后端架构
- 🐘 PostgreSQL 数据库
- 🔐 JWT 身份验证
- 📁 文件上传处理
- 🤖 老张API集成
有he
- ⚡ 实时任务状态追踪

## 🛠️ 快速开始

### 1. 环境准备

**必需软件：**
- Node.js 16+ 
- PostgreSQL 12+

**创建数据库：**
```sql
CREATE DATABASE yuan_world;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE yuan_world TO postgres;
```

### 2. 项目配置

**安装依赖：**
```bash
npm install
```

**配置环境变量：**
```bash
# 复制配置文件
copy env.example .env

# 编辑 .env 文件，配置以下参数：
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yuan_world
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=your_jwt_secret_here
LAOZHANG_API_URL=https://your-api-domain.com
LAOZHANG_API_KEY=your_api_key_here
```

### 3. 启动项目

**方式一：使用启动脚本（推荐）**
```bash
start.bat
```

**方式二：手动启动**
```bash
# 初始化数据库
node server/scripts/setup-database.js

# 启动服务器
npm start
```

### 4. 访问网站

- 🌍 前端网站：http://localhost:8080
- 🔌 API接口：http://localhost:8080/api
- 👤 管理员账户：admin@yuanworld.com / admin123456

## 📁 项目结构

```
yuan-world/
├── public/                 # 前端静态文件
│   ├── index.html         # 首页
│   ├── create.html        # 创作页面  
│   ├── gallery.html       # 模板中心
│   ├── before-after.html  # 效果对比
│   └── tech-pricing.html  # 技术价格
├── server/                # 后端代码
│   ├── config/           # 配置文件
│   ├── models/           # 数据库模型
│   ├── routes/           # API路由
│   ├── middleware/       # 中间件
│   ├── scripts/          # 脚本文件
│   └── index.js         # 服务器入口
├── uploads/              # 上传文件目录
├── package.json         # 项目配置
├── start.bat           # 启动脚本
└── README.md           # 说明文档
```

## 🔧 API接口文档

### 认证接口
```
POST /api/auth/register    # 用户注册
POST /api/auth/login       # 用户登录
GET  /api/auth/me          # 获取用户信息
PUT  /api/auth/me          # 更新用户信息
```

### 生图接口
```
GET  /api/generate/templates        # 获取模板列表
POST /api/generate/preview          # 生成预览图
POST /api/generate/high-quality     # 生成高清图
GET  /api/generate/status/:id       # 查询生成状态
GET  /api/generate/history          # 生成历史
```

### 统计接口
```
GET /api/stats/public     # 公开统计
GET /api/stats/personal   # 个人统计
GET /api/stats/admin      # 管理员统计
```

## 🗄️ 数据库设计

### 用户表 (users)
- 用户基础信息
- 订阅状态管理
- 每日预览次数控制

### 生成表 (generations)
- 生成任务记录
- 任务状态追踪
- 支付状态管理

### 模板表 (templates)
- 模板基础信息
- 分类管理
- VIP权限控制

## 🔌 老张API集成

项目已预留老张API集成接口，需要配置：

1. `LAOZHANG_API_URL`：API服务地址
2. `LAOZHANG_API_KEY`：API密钥

集成功能包括：
- 图片上传处理
- 生成任务提交
- 任务状态查询
- 结果图片下载

## 💳 支付功能

项目已预留支付接口，支持：
- 微信支付集成
- 支付宝集成
- 订单管理系统
- 收入统计分析

## 💸 分销返利系统

- 三级佣金结构：直属 20%、二级 5%、三级 3%
- 支持邀请码注册、专属邀请链接与团队统计
- 佣金支持待结算、结算、取消三种状态
- 提现申请内置最小金额与手续费配置

### 主要环境变量

| 变量名 | 说明 | 默认值 |
| ------ | ---- | ------ |
| `INVITE_BASE_URL` | 邀请注册链接前缀 | `https://idolphoto.com/register` |
| `COMMISSION_HOLD_DAYS` | 佣金冻结天数 | `7` |
| `WITHDRAW_MIN_AMOUNT` | 最小提现金额 | `20` |
| `WITHDRAW_FEE_TYPE` | 手续费类型 `flat`/`rate` | `flat` |
| `WITHDRAW_FEE_FLAT` | 固定手续费 | `1` |
| `WITHDRAW_FEE_RATE` | 百分比手续费 | `0.02` |
| `ORDER_PREFIX` | 订单号前缀 | `ORD` |

### 核心接口（需登录）

```
GET  /api/affiliate/overview          # 推广概览、团队统计、近6条佣金
GET  /api/affiliate/team?level=1..3   # 查看指定层级团队成员
GET  /api/affiliate/commissions       # 佣金明细（支持分页、状态过滤）
POST /api/affiliate/withdraw          # 发起提现申请
GET  /api/affiliate/withdrawals       # 查看提现记录
PUT  /api/affiliate/withdraw/account  # 绑定/更新提现账号
POST /api/affiliate/commissions/settle# 管理员结算到期佣金

POST /api/payment/balance/pay         # 使用余额支付并触发分销
POST /api/payment/orders/simulate     # 模拟创建已支付订单（测试用）
```

### 佣金结算策略

- 订单标记为 `paid` 后生成返利记录，状态为 `pending`
- 系统按照 `COMMISSION_HOLD_DAYS` 计算 `release_at`，到期后可由后台作业或管理员调用接口结算
- 结算时自动增加 `balance` 与 `total_commission`，并扣减 `pending_commission`
- 退款时调用 `markOrderRefunded`/`cancelOrderCommissions` 以回滚未结算佣金

## 🛡️ 安全特性

- JWT身份验证
- 请求频率限制
- 文件上传安全检查
- SQL注入防护
- XSS攻击防护

## 📊 监控统计

### 用户统计
- 新增用户趋势
- 活跃用户分析
- VIP转化率统计

### 业务统计
- 图片生成量统计
- 模板使用排行
- 收入分析报告

## 🚀 部署指南

### 🎯 快速部署（推荐）

本项目提供完整的WSL + Docker部署方案，可快速部署到腾讯云服务器。

#### 第一步：WSL环境测试
```bash
# 在WSL中运行自动配置脚本
./setup-wsl.sh
npm start
```

#### 第二步：Docker容器化
```bash
# 配置环境变量
cp .env.docker .env.production
nano .env.production

# 一键部署
./deploy.sh
```

#### 第三步：腾讯云部署
```bash
# 上传项目到服务器
scp yuan_world.tar.gz root@your_server_ip:~

# 在服务器上部署
./deploy.sh
```

**详细文档：**
- 📖 [快速开始指南](./QUICK-START.md) - 三步部署到腾讯云
- 📖 [WSL部署文档](./WSL-DEPLOYMENT.md) - 详细的WSL环境配置
- 📖 [Docker部署文档](./DOCKER-DEPLOYMENT.md) - 完整的Docker部署流程
- 📋 [部署清单](./DEPLOYMENT-CHECKLIST.md) - 部署检查清单

### 开发环境
```bash
npm run dev  # 开发模式启动
```

### 生产环境部署

#### 方式一：Docker部署（推荐）
```bash
# 1. 构建镜像
docker build -t yuan-world:latest .

# 2. 启动服务
docker-compose --env-file .env.production up -d

# 3. 查看状态
docker-compose ps
```

#### 方式二：传统部署
1. 设置 `NODE_ENV=production`
2. 配置生产环境数据库
3. 设置反向代理（Nginx）
4. 配置HTTPS证书
5. 设置进程管理（PM2）

### 配置文件说明

项目提供以下配置文件：
- `Dockerfile` - Docker镜像构建
- `docker-compose.yml` - 容器编排配置
- `.dockerignore` - Docker构建排除文件
- `nginx/nginx.conf` - Nginx反向代理配置
- `setup-wsl.sh` - WSL自动配置脚本
- `deploy.sh` - 一键部署脚本

## 🤝 开发说明

### 技术栈
- **后端**：Node.js + Express
- **数据库**：PostgreSQL + Sequelize ORM  
- **认证**：JWT + bcrypt
- **文件处理**：Multer
- **前端**：原生HTML/CSS/JavaScript

### 开发工具
- **代码检查**：ESLint
- **格式化**：Prettier
- **测试框架**：Jest
- **API文档**：Swagger

### 贡献指南
1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request

## 📝 更新日志

### v1.0.0 (2024-01-01)
- ✨ 完整的前端界面设计
- 🔐 用户注册登录系统
- 🤖 AI生图功能集成
- 📊 统计分析系统
- 💳 支付功能预留

## 📞 技术支持

如有问题，请联系：
- 📧 邮箱：support@yuanworld.com
- 💬 QQ群：123456789
- 📱 微信：YuanWorld2024

## 📄 开源协议

本项目采用 MIT 协议，详见 [LICENSE](LICENSE) 文件。

---

**源世界团队 ❤️ 用心打造**



