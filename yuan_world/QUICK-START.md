# Yuan World 快速开始指南

## 🎯 三步部署到腾讯云

### 第一步：WSL环境测试（本地）

```bash
# 1. 打开WSL
wsl

# 2. 复制项目到WSL
cd ~
mkdir -p projects
cp -r "/mnt/d/laozhang api claude  codegooglestudiou" ./projects/yuan_world

# 3. 运行自动配置脚本
cd projects/yuan_world
chmod +x setup-wsl.sh
./setup-wsl.sh

# 4. 启动服务测试
npm start

# 5. 在浏览器访问测试
# http://localhost:8080
```

**预计时间**: 15-20分钟

---

### 第二步：Docker本地测试（WSL）

```bash
# 1. 安装Docker（如未安装）
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. 配置环境变量
cd ~/projects/yuan_world
cp .env.docker .env.production
nano .env.production  # 编辑配置

# 4. 启动Docker服务
chmod +x deploy.sh
./deploy.sh
# 选择 "1) 首次部署"

# 5. 测试访问
curl http://localhost:8080/health
```

**预计时间**: 10-15分钟

---

### 第三步：部署到腾讯云

```bash
# 1. 连接到腾讯云服务器
ssh root@your_server_ip

# 2. 安装Docker环境
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. 上传项目（在本地WSL执行）
cd ~/projects
tar -czf yuan_world.tar.gz --exclude='node_modules' yuan_world/
scp yuan_world.tar.gz root@your_server_ip:~

# 4. 在服务器上解压并部署
ssh root@your_server_ip
tar -xzf yuan_world.tar.gz
cd yuan_world

# 5. 配置生产环境
cp .env.docker .env.production
nano .env.production  # 修改配置

# 6. 部署
chmod +x deploy.sh
./deploy.sh
# 选择 "1) 首次部署"

# 7. 验证部署
curl http://localhost:8080/health
```

**预计时间**: 15-20分钟

---

## 📝 重要配置项

✅ **好消息：老张API已完整配置，无需修改！**

在 `.env.production` 中**必须修改**的配置：

```bash
# 1. 生成强随机JWT密钥（生产环境必须修改）
JWT_SECRET=$(openssl rand -base64 32)

# 2. 生成强数据库密码（建议修改）
DB_PASSWORD=$(openssl rand -base64 24)

# 3. 配置域名（如有域名）
INVITE_BASE_URL=https://yourdomain.com/register

# ✅ 老张API已配置好，以下配置会自动继承，无需修改：
# LAOZHANG_API_URL=https://api.laozhang.ai/v1/chat/completions
# LAOZHANG_API_KEY=sk-NyROY2ZdW7yOdgmJDc57Cb204eB448CbA8B0Cd476849F165
```

详见 [IMPORTANT-NOTE.md](./IMPORTANT-NOTE.md) 了解更多。

---

## 🔧 常用命令

### 服务管理
```bash
./deploy.sh              # 交互式部署菜单
docker-compose ps        # 查看服务状态
docker-compose logs -f   # 查看实时日志
docker-compose restart   # 重启服务
```

### 数据库管理
```bash
# 备份数据库
docker exec yuan_world_db pg_dump -U ljxrain -F c yuan_world > backup.dump

# 恢复数据库
docker exec -i yuan_world_db pg_restore -U ljxrain -d yuan_world -c < backup.dump

# 进入数据库
docker exec -it yuan_world_db psql -U ljxrain yuan_world
```

### 日志查看
```bash
# 应用日志
docker-compose logs -f app

# 数据库日志
docker-compose logs -f postgres

# 查看最近100行
docker-compose logs --tail=100 app
```

---

## 🚀 访问应用

### 本地访问
- **HTTP**: http://localhost:8080
- **健康检查**: http://localhost:8080/health

### 服务器访问
- **HTTP**: http://your_server_ip:8080
- **HTTPS** (配置域名和SSL后): https://yourdomain.com

---

## 📱 配置域名和HTTPS（可选）

```bash
# 1. 配置域名解析
# 在域名提供商处，添加A记录指向服务器IP

# 2. 安装Certbot
sudo apt install certbot

# 3. 获取SSL证书
sudo certbot certonly --standalone -d yourdomain.com

# 4. 配置证书
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem

# 5. 编辑nginx配置启用HTTPS
nano nginx/nginx.conf

# 6. 启动带Nginx的服务
docker-compose --profile with-nginx --env-file .env.production up -d
```

---

## ✅ 验证部署成功

### 1. 检查服务状态
```bash
docker-compose ps
# 应该看到app和postgres都是Up状态
```

### 2. 测试健康检查
```bash
curl http://localhost:8080/health
# 应该返回 {"status":"ok",...}
```

### 3. 测试数据库
```bash
docker exec yuan_world_db psql -U ljxrain -d yuan_world -c "SELECT COUNT(*) FROM users;"
# 应该返回用户数量
```

### 4. 访问网站
在浏览器中访问 `http://your_server_ip:8080`，应该能看到网站首页。

---

## 🆘 遇到问题？

### 查看详细文档
1. **WSL部署**: [WSL-DEPLOYMENT.md](./WSL-DEPLOYMENT.md)
2. **Docker部署**: [DOCKER-DEPLOYMENT.md](./DOCKER-DEPLOYMENT.md)
3. **部署清单**: [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)

### 快速诊断
```bash
# 检查Docker状态
docker --version
docker-compose --version

# 检查服务状态
docker-compose ps

# 查看错误日志
docker-compose logs app | grep -i error

# 查看系统资源
docker stats
free -h
df -h
```

### 常见问题

**端口被占用**
```bash
# 修改docker-compose.yml中的端口
ports:
  - "3000:8080"  # 改为其他端口
```

**数据库连接失败**
```bash
# 检查数据库容器
docker-compose ps postgres
# 重启数据库
docker-compose restart postgres
```

**内存不足**
```bash
# 查看内存
free -h
# 在docker-compose.yml中限制内存使用
```

---

## 📞 技术支持

如果按照本指南操作仍有问题：

1. 查看 [DOCKER-DEPLOYMENT.md](./DOCKER-DEPLOYMENT.md) 故障排查部分
2. 检查日志：`docker-compose logs -f`
3. 验证配置：`docker-compose config`
4. 确认所有环境变量已正确设置

---

## 🎉 部署成功！

如果以上步骤都完成且测试通过，恭喜你成功部署了Yuan World！

**下一步建议：**
- ✅ 配置自动备份（见 DOCKER-DEPLOYMENT.md）
- ✅ 配置域名和HTTPS
- ✅ 设置监控和告警
- ✅ 进行性能优化
- ✅ 定期更新和维护

**享受你的Yuan World吧！** 🚀
