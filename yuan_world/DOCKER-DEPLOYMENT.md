# Yuan World Docker部署指南

## 概述

本指南说明如何使用Docker和Docker Compose将Yuan World项目部署到腾讯云服务器。

## 前置要求

### 1. 完成WSL环境测试

在进行Docker部署前，请确保：
- ✅ 已按照 `WSL-DEPLOYMENT.md` 完成WSL环境配置
- ✅ 在WSL中成功运行项目
- ✅ 所有功能和数据库正常工作

### 2. 安装Docker（在WSL或腾讯云服务器中）

```bash
# 更新包索引
sudo apt update

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 将当前用户添加到docker组
sudo usermod -aG docker $USER

# 注销并重新登录，或运行
newgrp docker

# 验证安装
docker --version
docker run hello-world
```

### 3. 安装Docker Compose

```bash
# 下载Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

## 本地Docker测试（在WSL中）

### 步骤1：准备配置文件

```bash
cd ~/projects/yuan_world

# 复制Docker环境变量配置
cp .env.docker .env.production

# 编辑配置文件，填写实际的API密钥等信息
nano .env.production
```

**重要配置项：**

```bash
# 生产环境必须修改JWT密钥
JWT_SECRET=生成一个强随机字符串

# 老张API配置
LAOZHANG_API_URL=实际的API地址
LAOZHANG_API_KEY=实际的API密钥

# 数据库密码（建议修改）
DB_PASSWORD=强密码
```

### 步骤2：构建Docker镜像

```bash
# 构建应用镜像
docker build -t yuan-world:latest .

# 查看构建的镜像
docker images | grep yuan-world
```

### 步骤3：启动服务

```bash
# 使用docker-compose启动所有服务
docker-compose --env-file .env.production up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 步骤4：验证服务

```bash
# 检查容器健康状态
docker ps

# 测试数据库连接
docker exec yuan_world_db psql -U ljxrain -d yuan_world -c "SELECT COUNT(*) FROM users;"

# 测试应用访问
curl http://localhost:8080

# 在浏览器中访问
# http://localhost:8080
```

### 步骤5：测试主要功能

1. 用户注册/登录
2. 浏览模板
3. 生成图片
4. 管理后台（如有）

确保所有功能正常后，再进行生产环境部署。

## 腾讯云服务器部署

### 准备工作

#### 1. 服务器要求

- **系统**: Ubuntu 20.04/22.04 LTS
- **配置**: 最低2核4GB，推荐4核8GB
- **存储**: 至少40GB SSD
- **网络**: 公网IP，已开放80、443、8080端口

#### 2. 配置安全组

在腾讯云控制台配置安全组规则：

| 协议 | 端口 | 源地址 | 说明 |
|------|------|--------|------|
| TCP | 22 | 你的IP | SSH |
| TCP | 80 | 0.0.0.0/0 | HTTP |
| TCP | 443 | 0.0.0.0/0 | HTTPS |
| TCP | 8080 | 127.0.0.1 | 应用端口（内网） |

#### 3. 连接到服务器

```bash
# 使用SSH连接（替换为你的服务器IP）
ssh root@your_server_ip

# 或使用密钥
ssh -i your_key.pem ubuntu@your_server_ip
```

### 部署步骤

#### 第1步：准备服务器环境

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y git curl wget

# 安装Docker和Docker Compose（参考前面的安装步骤）
```

#### 第2步：上传项目文件

有多种方式将项目上传到服务器：

**方式1：使用Git（推荐）**

```bash
# 在服务器上
cd ~
git clone <你的仓库地址> yuan_world
cd yuan_world
```

**方式2：使用SCP从WSL上传**

```bash
# 在WSL中
cd ~/projects
tar -czf yuan_world.tar.gz yuan_world/

# 上传到服务器
scp yuan_world.tar.gz root@your_server_ip:~

# 在服务器上解压
ssh root@your_server_ip
tar -xzf yuan_world.tar.gz
cd yuan_world
```

**方式3：使用rsync（推荐用于更新）**

```bash
# 在WSL中
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  ~/projects/yuan_world/ \
  root@your_server_ip:~/yuan_world/
```

#### 第3步：配置环境变量

```bash
cd ~/yuan_world

# 创建生产环境配置
cp .env.docker .env.production

# 编辑配置（使用vim或nano）
vim .env.production
```

**生产环境必须修改的配置：**

```bash
# 数据库密码
DB_PASSWORD=生成强密码

# JWT密钥（必须修改！）
JWT_SECRET=生成长随机字符串例如openssl_rand_-base64_32

# 域名配置
INVITE_BASE_URL=https://yourdomain.com/register

# API配置
LAOZHANG_API_URL=实际API地址
LAOZHANG_API_KEY=实际API密钥
```

生成强密码和密钥：

```bash
# 生成JWT密钥
openssl rand -base64 32

# 生成数据库密码
openssl rand -base64 24
```

#### 第4步：启动Docker服务

```bash
# 构建镜像
docker build -t yuan-world:latest .

# 启动服务
docker-compose --env-file .env.production up -d

# 查看启动状态
docker-compose ps

# 查看日志
docker-compose logs -f app
```

#### 第5步：配置域名和SSL

如果有域名，配置Nginx反向代理：

```bash
# 使用Nginx profile启动
docker-compose --profile with-nginx --env-file .env.production up -d

# 配置SSL证书（使用Let's Encrypt）
sudo apt install certbot

# 获取SSL证书
sudo certbot certonly --standalone -d yourdomain.com

# 复制证书到nginx目录
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem

# 编辑nginx配置，启用HTTPS部分
vim nginx/nginx.conf

# 重启nginx容器
docker-compose restart nginx
```

#### 第6步：设置自动启动

```bash
# Docker服务开机自启
sudo systemctl enable docker

# 创建systemd服务文件
sudo vim /etc/systemd/system/yuan-world.service
```

添加以下内容：

```ini
[Unit]
Description=Yuan World Docker Compose Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/root/yuan_world
ExecStart=/usr/local/bin/docker-compose --env-file .env.production up -d
ExecStop=/usr/local/bin/docker-compose --env-file .env.production down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
# 重载systemd
sudo systemctl daemon-reload

# 启用服务
sudo systemctl enable yuan-world

# 启动服务
sudo systemctl start yuan-world

# 查看状态
sudo systemctl status yuan-world
```

## 维护和管理

### 日常命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app
docker-compose logs -f postgres

# 重启服务
docker-compose restart app

# 停止服务
docker-compose stop

# 启动服务
docker-compose start

# 完全停止并删除容器
docker-compose down

# 停止并删除所有数据（危险！）
docker-compose down -v
```

### 更新应用

```bash
# 1. 拉取最新代码
git pull

# 或使用rsync同步
rsync -avz --exclude 'node_modules' ...

# 2. 重新构建镜像
docker build -t yuan-world:latest .

# 3. 重启服务
docker-compose --env-file .env.production up -d --force-recreate app

# 4. 查看日志确认
docker-compose logs -f app
```

### 数据库备份

```bash
# 创建备份目录
mkdir -p ~/backups

# 备份数据库
docker exec yuan_world_db pg_dump -U ljxrain yuan_world > ~/backups/yuan_world_$(date +%Y%m%d_%H%M%S).sql

# 或使用自定义格式
docker exec yuan_world_db pg_dump -U ljxrain -F c yuan_world > ~/backups/yuan_world_$(date +%Y%m%d_%H%M%S).dump

# 自动备份脚本
cat > ~/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups
mkdir -p $BACKUP_DIR
docker exec yuan_world_db pg_dump -U ljxrain -F c yuan_world > $BACKUP_DIR/yuan_world_$(date +%Y%m%d_%H%M%S).dump
# 删除30天前的备份
find $BACKUP_DIR -name "yuan_world_*.dump" -mtime +30 -delete
EOF

chmod +x ~/backup-db.sh

# 添加到crontab（每天凌晨2点备份）
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup-db.sh") | crontab -
```

### 恢复数据库

```bash
# 从备份恢复
docker exec -i yuan_world_db pg_restore -U ljxrain -d yuan_world -c < ~/backups/yuan_world_20241013.dump

# 或从SQL文件
docker exec -i yuan_world_db psql -U ljxrain yuan_world < ~/backups/yuan_world_20241013.sql
```

### 监控和日志

```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
df -h
docker system df

# 清理未使用的镜像和容器
docker system prune -a

# 查看应用日志
docker-compose logs -f --tail=100 app

# 查看数据库日志
docker-compose logs -f --tail=100 postgres
```

## 性能优化

### 1. Docker资源限制

编辑 `docker-compose.yml`：

```yaml
services:
  app:
    # ... 其他配置
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 2. PostgreSQL优化

```bash
# 进入数据库容器
docker exec -it yuan_world_db psql -U ljxrain yuan_world

# 执行优化
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '16MB';

# 重启数据库
docker-compose restart postgres
```

### 3. 启用Nginx缓存

在 `nginx/nginx.conf` 中添加：

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=yuan_cache:10m max_size=100m;

location / {
    proxy_cache yuan_cache;
    proxy_cache_valid 200 10m;
    # ... 其他配置
}
```

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs app

# 检查配置
docker-compose config

# 重新构建
docker-compose build --no-cache app
```

### 数据库连接失败

```bash
# 检查数据库容器
docker-compose ps postgres

# 进入数据库容器测试
docker exec -it yuan_world_db psql -U ljxrain yuan_world

# 查看数据库日志
docker-compose logs postgres
```

### 应用报错

```bash
# 查看应用日志
docker-compose logs -f app

# 进入容器调试
docker exec -it yuan_world_app sh

# 检查文件权限
docker exec yuan_world_app ls -la public/images
```

### 端口被占用

```bash
# 查看端口占用
sudo netstat -tulpn | grep 8080

# 修改docker-compose.yml中的端口映射
ports:
  - "3000:8080"  # 改为其他端口
```

## 安全建议

1. **修改默认密码**
   - 数据库密码
   - JWT密钥
   - 管理员账户密码

2. **配置防火墙**
   ```bash
   sudo ufw enable
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   ```

3. **定期更新**
   ```bash
   sudo apt update && sudo apt upgrade
   docker-compose pull
   ```

4. **启用SSL/TLS**
   - 使用Let's Encrypt获取免费证书
   - 强制HTTPS访问

5. **日志管理**
   - 定期清理日志
   - 设置日志轮转

6. **备份策略**
   - 每日自动备份数据库
   - 定期备份代码和配置
   - 将备份存储到对象存储（如腾讯云COS）

## 监控方案（可选）

### 使用Portainer管理Docker

```bash
# 安装Portainer
docker volume create portainer_data
docker run -d -p 9000:9000 --name portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce

# 访问 http://your_server_ip:9000
```

### 添加健康检查端点

在应用中添加健康检查路由（如果还没有）：

```javascript
// server/index.js
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});
```

## 总结

完成以上步骤后，你的Yuan World应用应该已经成功部署到腾讯云服务器了！

**部署清单：**

- ✅ Docker环境配置完成
- ✅ 应用容器运行正常
- ✅ 数据库容器运行正常
- ✅ 数据成功迁移
- ✅ 域名和SSL配置（如有）
- ✅ 自动启动配置
- ✅ 备份策略配置
- ✅ 防火墙和安全配置

**访问你的应用：**

- HTTP: `http://your_server_ip:8080`
- 或配置域名后: `https://yourdomain.com`

如有问题，查看日志或参考故障排查部分。
