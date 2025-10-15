# ⚠️ 重要说明

## 老张API配置 - 已完成 ✅

**好消息！** 你的项目中老张API配置已经完整，**无需重新设置**！

### 当前配置（已可用）

```bash
LAOZHANG_API_URL=https://api.laozhang.ai/v1/chat/completions
LAOZHANG_API_KEY=sk-NyROY2ZdW7yOdgmJDc57Cb204eB448CbA8B0Cd476849F165
```

这个配置在以下文件中都已经自动配置好：
- ✅ `.env` - 当前开发环境配置
- ✅ `.env.docker` - Docker环境模板
- ✅ `setup-wsl.sh` - WSL脚本会自动保留此配置

---

## 实际需要修改的配置（仅这两项）

### 1. JWT密钥（必须修改）

生产环境部署时，出于安全考虑，需要修改JWT密钥：

```bash
# 生成新的JWT密钥
openssl rand -base64 32

# 在 .env.production 中替换
JWT_SECRET=生成的新密钥
```

### 2. 数据库密码（可选修改）

如果需要更高的安全性，可以修改数据库密码：

```bash
# 生成新密码
openssl rand -base64 24

# 在 .env.production 中替换
DB_PASSWORD=生成的新密码
```

---

## 快速部署步骤（修正版）

### WSL环境测试

```bash
# 1. 复制项目到WSL
wsl
mkdir -p ~/projects
cp -r "/mnt/d/laozhang api claude  codegooglestudiou" ~/projects/yuan_world
cd ~/projects/yuan_world

# 2. 运行配置脚本（会自动保留老张API配置）
chmod +x setup-wsl.sh
./setup-wsl.sh

# 3. 启动测试
npm start

# 访问 http://localhost:8080 测试
```

**老张API会自动工作，无需额外配置！** ✅

---

### Docker部署

```bash
# 1. 复制环境配置
cp .env.docker .env.production

# 2. 只需修改JWT密钥（老张API已配置好）
nano .env.production
# 修改这一行：
# JWT_SECRET=<使用 openssl rand -base64 32 生成>

# 3. 一键部署
chmod +x deploy.sh
./deploy.sh
# 选择 "1) 首次部署"
```

---

## 配置文件说明

### `.env` - 开发环境（当前正在使用）
```bash
# 老张API - 已配置 ✅
LAOZHANG_API_URL=https://api.laozhang.ai/v1/chat/completions
LAOZHANG_API_KEY=sk-NyROY2ZdW7yOdgmJDc57Cb204eB448CbA8B0Cd476849F165

# 数据库 - Windows开发环境
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres

# JWT - 开发环境（可以不改）
JWT_SECRET=yuan_world_secret_key_2024
```

### `.env.production` - 生产环境（需要创建）
```bash
# 复制 .env.docker 并只修改这两项：

# 1. JWT密钥（必须修改）
JWT_SECRET=<新生成的密钥>

# 2. 数据库密码（可选）
DB_PASSWORD=<新密码>

# 老张API会自动从 .env.docker 继承，无需修改 ✅
```

---

## 总结

### ✅ 已配置好，无需修改：
- 老张API URL
- 老张API Key
- 所有其他功能配置

### ⚠️ 生产环境需要修改：
- JWT_SECRET（安全必须）
- DB_PASSWORD（可选，建议修改）

### 🚀 部署步骤简化为：
1. 运行 `./setup-wsl.sh`（WSL环境）
2. 运行 `./deploy.sh`（Docker环境）
3. 只需修改JWT密钥即可部署

**就这么简单！** 老张API已经完全配置好了，可以直接使用。🎉
