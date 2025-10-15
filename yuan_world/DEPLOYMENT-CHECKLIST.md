# Yuan World 部署清单

## 📋 WSL环境迁移清单

### 准备阶段
- [ ] 确认Windows环境下项目运行正常
- [ ] 确认已安装WSL2
- [ ] 确认使用Ubuntu 20.04或22.04
- [ ] 确认数据库dump文件存在（yuan_world_full.dump）

### 文件迁移
- [ ] 将项目复制到WSL环境（`~/projects/yuan_world`）
- [ ] 确认所有文件完整（特别是`node_modules`可以删除后重新安装）
- [ ] 确认数据库dump文件已复制到WSL

### 环境配置
- [ ] 运行 `./setup-wsl.sh` 脚本
- [ ] 检查PostgreSQL服务运行状态
- [ ] 检查Node.js和npm版本
- [ ] 验证数据库连接成功
- [ ] 检查所有必要目录已创建

### 数据验证
- [ ] 验证数据库表已导入（users, templates, generations, orders, withdrawals）
- [ ] 检查数据库数据完整性
- [ ] 验证用户数据存在
- [ ] 验证模板数据存在
- [ ] 验证历史生成记录存在

### 功能测试
- [ ] 启动服务器（`npm start` 或 `npm run dev`）
- [ ] 访问首页（http://localhost:8080）
- [ ] 测试用户注册功能
- [ ] 测试用户登录功能
- [ ] 测试模板浏览功能
- [ ] 测试图片生成功能（如果API可用）
- [ ] 测试管理后台（如有管理员账户）
- [ ] 测试用户中心功能
- [ ] 检查图片上传和显示

### 性能检查
- [ ] 检查服务器响应时间
- [ ] 检查数据库查询性能
- [ ] 检查内存使用情况
- [ ] 检查磁盘空间

---

## 🐳 Docker部署清单

### 准备阶段
- [ ] WSL环境测试通过
- [ ] 安装Docker和Docker Compose
- [ ] 配置 `.env.production` 文件
- [ ] **修改JWT_SECRET为强随机字符串**
- [ ] **修改数据库密码**
- [ ] **配置老张API密钥**

### Docker构建
- [ ] 检查 `Dockerfile` 配置
- [ ] 检查 `docker-compose.yml` 配置
- [ ] 检查 `.dockerignore` 文件
- [ ] 构建Docker镜像成功
- [ ] 镜像大小合理（< 500MB）

### 服务启动
- [ ] PostgreSQL容器启动成功
- [ ] 应用容器启动成功
- [ ] 容器健康检查通过
- [ ] 检查容器日志无错误

### 数据库验证
- [ ] 数据库容器可访问
- [ ] 数据库数据完整导入
- [ ] 应用可以连接数据库
- [ ] 数据库备份脚本配置

### 应用测试
- [ ] 访问应用（http://localhost:8080）
- [ ] 健康检查端点正常（/health）
- [ ] 测试主要功能（注册、登录、生图）
- [ ] 测试文件上传
- [ ] 测试管理功能

---

## ☁️ 腾讯云服务器部署清单

### 服务器准备
- [ ] 购买腾讯云服务器（2核4GB以上）
- [ ] 配置安全组（开放22、80、443端口）
- [ ] 获取服务器公网IP
- [ ] 配置SSH密钥登录
- [ ] 更新系统包

### 环境安装
- [ ] 安装Docker
- [ ] 安装Docker Compose
- [ ] 配置Docker用户权限
- [ ] 验证Docker安装

### 项目部署
- [ ] 上传项目文件到服务器
- [ ] 配置 `.env.production`（生产环境配置）
- [ ] 运行 `./deploy.sh` 选择"首次部署"
- [ ] 检查服务启动状态

### 域名和SSL（可选）
- [ ] 配置域名解析到服务器IP
- [ ] 安装Certbot
- [ ] 获取SSL证书
- [ ] 配置Nginx反向代理
- [ ] 启用HTTPS访问

### 安全配置
- [ ] 修改所有默认密码
- [ ] 配置防火墙（ufw）
- [ ] 禁用root远程登录
- [ ] 配置SSH密钥认证
- [ ] 定期更新系统

### 监控和维护
- [ ] 配置自动备份（crontab）
- [ ] 设置日志轮转
- [ ] 配置磁盘监控
- [ ] 配置服务自动重启
- [ ] 安装监控工具（可选：Portainer）

### 性能优化
- [ ] 配置PostgreSQL参数
- [ ] 配置Nginx缓存
- [ ] 启用Gzip压缩
- [ ] 配置静态文件CDN（可选）

---

## 🧪 最终验证清单

### 功能验证
- [ ] ✅ 用户可以注册新账户
- [ ] ✅ 用户可以登录
- [ ] ✅ 可以浏览所有模板
- [ ] ✅ 可以生成图片（API正常时）
- [ ] ✅ 可以查看生成历史
- [ ] ✅ 可以查看用户中心
- [ ] ✅ 管理员可以访问后台
- [ ] ✅ 图片可以正常显示
- [ ] ✅ 文件上传功能正常

### 性能验证
- [ ] ✅ 页面加载时间 < 3秒
- [ ] ✅ API响应时间 < 500ms
- [ ] ✅ 数据库查询优化
- [ ] ✅ 并发请求处理正常

### 安全验证
- [ ] ✅ 使用了强密码
- [ ] ✅ JWT密钥已修改
- [ ] ✅ API密钥已配置
- [ ] ✅ 防火墙已配置
- [ ] ✅ HTTPS已启用（如有域名）

### 运维验证
- [ ] ✅ 自动备份配置完成
- [ ] ✅ 日志可以正常查看
- [ ] ✅ 服务可以自动重启
- [ ] ✅ 监控系统配置（可选）

---

## 🚨 常见问题快速参考

### 问题：服务无法启动
```bash
# 检查日志
docker-compose logs -f

# 检查端口占用
sudo netstat -tulpn | grep 8080

# 重启服务
docker-compose restart
```

### 问题：数据库连接失败
```bash
# 检查数据库容器
docker-compose ps postgres

# 进入数据库
docker exec -it yuan_world_db psql -U ljxrain yuan_world

# 查看数据库日志
docker-compose logs postgres
```

### 问题：图片无法显示
```bash
# 检查文件权限
ls -la public/images

# 修复权限
chmod -R 755 public/images
```

### 问题：内存不足
```bash
# 查看内存使用
free -h

# 查看容器资源
docker stats

# 限制容器内存（在docker-compose.yml中配置）
```

---

## 📞 紧急联系信息

### 文档位置
- WSL部署: `WSL-DEPLOYMENT.md`
- Docker部署: `DOCKER-DEPLOYMENT.md`
- 本清单: `DEPLOYMENT-CHECKLIST.md`

### 重要命令
```bash
# 启动服务
docker-compose --env-file .env.production up -d

# 查看日志
docker-compose logs -f

# 备份数据库
./deploy.sh # 选择选项7

# 重启服务
docker-compose restart

# 停止服务
docker-compose stop
```

### 备份文件位置
- 数据库备份: `~/backups/`
- 项目备份: `~/yuan_world.tar.gz`

---

## ✅ 部署完成标准

当以下所有条件都满足时，视为部署成功：

1. ✅ 应用可以通过公网IP或域名访问
2. ✅ 所有核心功能正常工作
3. ✅ 数据库数据完整
4. ✅ 自动备份已配置
5. ✅ 服务可以自动重启
6. ✅ 日志和监控正常
7. ✅ 安全配置完成
8. ✅ 性能达到要求

**恭喜！你的Yuan World已成功部署！🎉**
