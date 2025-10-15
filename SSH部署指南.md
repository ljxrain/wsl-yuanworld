# 狗狗造梦家 - SSH 部署指南

## 📋 准备工作

### 1. 腾讯云服务器要求

- **系统**: Ubuntu 20.04 或更高版本
- **配置**: 至少 2 核 4GB（推荐 4 核 8GB）
- **网络**: 已开放 22, 80, 443 端口
- **存储**: 至少 20GB 可用空间

### 2. 本地准备

- ✅ 部署包已创建: `dreamhome-deploy-20250618_125151.tar.gz` (188M)
- ⚠️ 需要豆包 API 密钥和接入点 ID

## 🚀 部署步骤

### 步骤 1: SSH 连接服务器

```bash
ssh root@你的服务器IP
```

### 步骤 2: 上传部署包

**方法 A: 使用 scp（推荐）**

```bash
# 在本地Windows命令行中运行
scp dreamhome-deploy-20250618_125151.tar.gz root@你的服务器IP:/opt/
```

**方法 B: 使用 SFTP 工具**

- 使用 WinSCP、FileZilla 等工具
- 上传到服务器的 `/opt/` 目录

### 步骤 3: 服务器端部署

```bash
# 进入目录
cd /opt

# 解压部署包
tar -xzf dreamhome-deploy-20250618_125151.tar.gz

# 进入项目目录
cd dreamhome

# 给部署脚本执行权限
chmod +x deploy-to-tencent.sh

# 运行部署脚本
./deploy-to-tencent.sh
```

### 步骤 4: 配置豆包 API

```bash
# 编辑环境变量文件
nano .env

# 修改以下配置：
DOUBAO_API_KEY="你的豆包API密钥"
DOUBAO_ACCESS_POINT_ID="你的接入点ID"
```

### 步骤 5: 重启服务

```bash
pm2 restart dreamhome
```

## 🔧 部署后管理

### 常用命令

```bash
# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs dreamhome

# 重启服务
pm2 restart dreamhome

# 停止服务
pm2 stop dreamhome

# 查看Nginx状态
sudo systemctl status nginx

# 重启Nginx
sudo systemctl restart nginx
```

### 查看网站

- 浏览器访问: `http://你的服务器IP`
- 登录账户: `pm@dreamhome.com` 密码: `123456`

## 🛠️ 故障排查

### 1. 服务无法启动

```bash
# 查看详细日志
pm2 logs dreamhome --lines 50

# 检查端口占用
netstat -tlnp | grep 3000

# 检查数据库连接
sudo -u postgres psql -c "\l"
```

### 2. 网站无法访问

```bash
# 检查Nginx状态
sudo nginx -t
sudo systemctl status nginx

# 检查防火墙
sudo ufw status

# 检查端口开放
curl -I http://localhost:3000
```

### 3. 豆包 API 错误

```bash
# 检查环境变量
cat .env | grep DOUBAO

# 测试网络连接
curl -I https://ark.cn-beijing.volces.com
```

## 📝 部署清单

- [ ] 服务器环境准备完成
- [ ] 部署包上传成功
- [ ] 部署脚本执行完成
- [ ] 豆包 API 配置正确
- [ ] 数据库初始化成功
- [ ] PM2 服务启动正常
- [ ] Nginx 配置生效
- [ ] 防火墙规则设置
- [ ] 网站可正常访问
- [ ] 功能测试通过

## 🔐 安全建议

1. **修改默认密码**: 登录后立即修改所有默认账户密码
2. **配置 SSL 证书**: 使用 Let's Encrypt 或其他证书
3. **定期备份**: 设置数据库和文件自动备份
4. **监控告警**: 配置服务器监控和告警

## 📞 技术支持

如遇到问题，请检查：

1. 服务器日志: `pm2 logs dreamhome`
2. Nginx 日志: `sudo tail -f /var/log/nginx/error.log`
3. 系统日志: `sudo journalctl -u nginx -f`

---

**🎉 部署完成后，你的狗狗造梦家网站就可以在腾讯云上正常运行了！**
