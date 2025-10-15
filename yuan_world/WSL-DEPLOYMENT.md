# Yuan World WSL环境部署指南

## 概述

本指南详细说明如何将Yuan World项目从Windows环境迁移到WSL（Windows Subsystem for Linux）环境，并确保所有功能和数据库完整可用。

## 前置要求

1. **已安装WSL2**
   ```bash
   # 在PowerShell中检查WSL版本
   wsl --list --verbose
   ```

2. **推荐使用Ubuntu 20.04或22.04**
   ```bash
   # 如需安装Ubuntu
   wsl --install -d Ubuntu-22.04
   ```

## 迁移步骤

### 第一步：复制项目到WSL

有两种方法可以将项目复制到WSL：

#### 方法1：从Windows复制到WSL（推荐）

```bash
# 1. 在Windows PowerShell中，进入项目目录
cd "d:\laozhang api claude  codegooglestudiou"

# 2. 打开WSL
wsl

# 3. 在WSL中创建项目目录
mkdir -p ~/projects
cd ~/projects

# 4. 从Windows路径复制项目（在WSL中执行）
cp -r "/mnt/d/laozhang api claude  codegooglestudiou" ./yuan_world

# 5. 进入项目目录
cd yuan_world
```

#### 方法2：使用Git克隆（如果项目在Git仓库中）

```bash
cd ~/projects
git clone <你的仓库地址> yuan_world
cd yuan_world
```

### 第二步：运行自动化配置脚本

项目包含一个自动化配置脚本 `setup-wsl.sh`，它会完成以下操作：

1. 更新系统包
2. 安装必要工具（curl, wget, git, build-essential）
3. 安装PostgreSQL数据库
4. 启动PostgreSQL服务
5. 创建数据库和用户
6. 导入数据库备份
7. 安装Node.js 18.x
8. 安装项目依赖
9. 配置环境变量
10. 创建必要的目录

**执行配置脚本：**

```bash
# 确保在项目根目录
cd ~/projects/yuan_world

# 给脚本添加执行权限
chmod +x setup-wsl.sh

# 运行配置脚本
./setup-wsl.sh
```

脚本执行时间约5-15分钟，取决于网络速度和系统性能。

### 第三步：验证安装

#### 3.1 检查PostgreSQL服务

```bash
# 查看服务状态
sudo service postgresql status

# 如果未运行，启动服务
sudo service postgresql start

# 测试数据库连接
psql -U ljxrain -d yuan_world -c "SELECT COUNT(*) FROM users;"
```

#### 3.2 检查数据库表

```bash
# 连接到数据库
psql -U ljxrain -d yuan_world

# 列出所有表
\dt

# 预期看到以下表：
# - users
# - templates
# - generations
# - orders
# - withdrawals

# 退出
\q
```

#### 3.3 测试Node.js连接

```bash
node -e "require('./server/config/database-instance.js').sequelize.authenticate().then(() => console.log('数据库连接成功！')).catch(err => console.error('连接失败:', err))"
```

### 第四步：启动服务

```bash
# 方式1：生产模式
npm start

# 方式2：开发模式（支持热重载）
npm run dev
```

服务默认运行在端口 **8080**。

### 第五步：测试访问

1. **在WSL中测试**
   ```bash
   curl http://localhost:8080
   ```

2. **在Windows浏览器中访问**
   ```
   http://localhost:8080
   ```

3. **测试主要功能**
   - 用户注册/登录
   - 模板浏览
   - 图片生成
   - 管理后台（如有管理员账户）

## 环境配置

### 数据库配置

配置文件位置：`.env`

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yuan_world
DB_USER=ljxrain
DB_PASSWORD=postgres
```

### 服务器配置

```bash
PORT=8080
NODE_ENV=development
```

### API配置

确保老张API的配置正确：

```bash
LAOZHANG_API_URL=https://api.example.com
LAOZHANG_API_KEY=your_api_key_here
```

## 常见问题排查

### 问题1：PostgreSQL服务无法启动

```bash
# 查看错误日志
sudo tail -f /var/log/postgresql/postgresql-*-main.log

# 检查端口是否被占用
sudo netstat -tulpn | grep 5432

# 重启服务
sudo service postgresql restart
```

### 问题2：数据库导入失败

```bash
# 手动导入数据库
sudo -u postgres dropdb yuan_world
sudo -u postgres createdb yuan_world
sudo -u postgres pg_restore -d yuan_world -v yuan_world_full.dump

# 如果是权限问题
sudo -u postgres psql -d yuan_world -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ljxrain;"
sudo -u postgres psql -d yuan_world -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ljxrain;"
```

### 问题3：Node.js依赖安装失败

```bash
# 清理npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install

# 如果是sharp模块问题
npm install --platform=linux --arch=x64 sharp
```

### 问题4：文件权限错误

```bash
# 设置正确的文件权限
chmod -R 755 public/images
chmod -R 755 uploads

# 如果需要，改变文件所有者
sudo chown -R $USER:$USER ~/projects/yuan_world
```

### 问题5：端口被占用

```bash
# 查看占用端口的进程
sudo netstat -tulpn | grep 8080

# 或使用lsof
sudo lsof -i :8080

# 修改端口（在.env文件中）
PORT=3000
```

## 性能优化建议

### 1. WSL2配置优化

创建或编辑 `C:\Users\你的用户名\.wslconfig`：

```ini
[wsl2]
memory=4GB
processors=2
swap=2GB
```

### 2. PostgreSQL优化

编辑PostgreSQL配置文件：

```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

调整以下参数：

```ini
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 16MB
```

重启PostgreSQL：

```bash
sudo service postgresql restart
```

### 3. Node.js生产环境配置

在 `.env` 中：

```bash
NODE_ENV=production
```

使用PM2管理进程（可选）：

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start server/index.js --name yuan-world

# 查看状态
pm2 status

# 查看日志
pm2 logs yuan-world

# 设置开机自启
pm2 startup
pm2 save
```

## 数据备份

### 备份数据库

```bash
# 创建备份目录
mkdir -p ~/backups

# 备份数据库
pg_dump -U ljxrain yuan_world > ~/backups/yuan_world_$(date +%Y%m%d_%H%M%S).sql

# 或使用自定义格式（推荐）
pg_dump -U ljxrain -F c yuan_world > ~/backups/yuan_world_$(date +%Y%m%d_%H%M%S).dump
```

### 备份文件

```bash
# 备份上传的图片
tar -czf ~/backups/images_$(date +%Y%m%d_%H%M%S).tar.gz public/images/generations
```

### 恢复数据库

```bash
# 从SQL文件恢复
psql -U ljxrain yuan_world < ~/backups/yuan_world_20241013.sql

# 从dump文件恢复
pg_restore -U ljxrain -d yuan_world ~/backups/yuan_world_20241013.dump
```

## WSL服务管理

### 自动启动PostgreSQL

创建启动脚本 `~/start-services.sh`：

```bash
#!/bin/bash
sudo service postgresql start
echo "PostgreSQL服务已启动"
```

使其可执行：

```bash
chmod +x ~/start-services.sh
```

在Windows中可以创建快捷方式来启动WSL并运行服务：

```batch
wsl -d Ubuntu-22.04 -u root service postgresql start
```

## 下一步：Docker部署

完成WSL环境测试后，请参考 `DOCKER-DEPLOYMENT.md` 文档进行Docker容器化部署。

## 技术支持

如遇到问题：

1. 查看应用日志
2. 查看PostgreSQL日志：`/var/log/postgresql/`
3. 检查系统资源：`top` 或 `htop`
4. 验证网络连接：`curl http://localhost:8080/health`（如有健康检查端点）

## 附录：快速命令参考

```bash
# PostgreSQL管理
sudo service postgresql start|stop|restart|status
psql -U ljxrain -d yuan_world

# Node.js应用
npm start                 # 启动应用
npm run dev              # 开发模式
node server/index.js     # 直接启动

# 系统管理
df -h                    # 查看磁盘空间
free -h                  # 查看内存使用
top                      # 查看进程
sudo netstat -tulpn      # 查看端口占用

# 日志查看
tail -f server/logs/*.log              # 应用日志（如有）
sudo tail -f /var/log/postgresql/*.log # 数据库日志
```

---

**注意事项：**

1. 确保 `yuan_world_full.dump` 文件在项目根目录
2. WSL中的时间应与Windows同步
3. 防火墙可能需要允许端口8080
4. 建议定期备份数据库和文件
5. 生产环境请修改默认密码和JWT密钥
