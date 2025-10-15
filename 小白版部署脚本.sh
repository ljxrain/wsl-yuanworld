#!/bin/bash

echo "🎯 =============================================🎯"
echo "      狗狗造梦家 - 小白专用一键部署脚本"
echo "🎯 =============================================🎯"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 欢迎信息
echo -e "${BLUE}👋 欢迎使用狗狗造梦家部署工具！${NC}"
echo -e "${YELLOW}本脚本将帮助您把网站部署到腾讯云服务器${NC}"
echo ""

# 第一步：确认信息
echo -e "${GREEN}📋 第一步：请提供服务器信息${NC}"
echo "================================================"

# 获取服务器IP
while true; do
    echo -n "请输入您的腾讯云服务器IP地址 (例如: 123.456.789.012): "
    read SERVER_IP
    if [[ $SERVER_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        break
    else
        echo -e "${RED}❌ IP地址格式不正确，请重新输入${NC}"
    fi
done

# 询问是否有域名
echo ""
echo -n "您是否有已备案的域名？(有域名输入y，没有输入n): "
read HAS_DOMAIN

if [[ $HAS_DOMAIN == "y" || $HAS_DOMAIN == "Y" ]]; then
    echo -n "请输入您的域名 (例如: example.com): "
    read DOMAIN_NAME
    PUBLIC_URL="https://$DOMAIN_NAME"
else
    DOMAIN_NAME="$SERVER_IP"
    PUBLIC_URL="http://$SERVER_IP"
    echo -e "${YELLOW}⚠️  没有域名，将使用IP地址访问${NC}"
fi

# 确认信息
echo ""
echo -e "${GREEN}✅ 配置信息确认${NC}"
echo "================================================"
echo "服务器IP: $SERVER_IP"
echo "访问地址: $PUBLIC_URL"
echo "项目名称: dreamhome"
echo "数据库密码: postgres"
echo ""

echo -n "信息确认无误？继续部署请输入 y，重新填写请输入 n: "
read CONFIRM

if [[ $CONFIRM != "y" && $CONFIRM != "Y" ]]; then
    echo -e "${RED}❌ 用户取消部署${NC}"
    exit 1
fi

# 第二步：检查本地环境
echo ""
echo -e "${GREEN}🔍 第二步：检查本地环境${NC}"
echo "================================================"

# 检查SSH
if ! command -v ssh &> /dev/null; then
    echo -e "${RED}❌ 未找到SSH客户端，请先安装Git for Windows${NC}"
    echo "下载地址: https://git-scm.com/download/win"
    exit 1
fi

echo -e "${GREEN}✅ SSH客户端已安装${NC}"

# 第三步：连接测试
echo ""
echo -e "${GREEN}🔗 第三步：测试服务器连接${NC}"
echo "================================================"

echo -e "${YELLOW}正在测试SSH连接到服务器...${NC}"
echo -e "${YELLOW}如果这是第一次连接，会询问是否信任服务器，请输入 yes${NC}"
echo -e "${YELLOW}然后会要求输入root密码，请输入您的服务器密码${NC}"
echo ""

# 测试连接
if ssh -o ConnectTimeout=10 root@$SERVER_IP "echo '连接成功'" 2>/dev/null; then
    echo -e "${GREEN}✅ 服务器连接正常${NC}"
else
    echo -e "${RED}❌ 无法连接到服务器，请检查：${NC}"
    echo "1. IP地址是否正确"
    echo "2. 服务器是否正在运行"
    echo "3. 密码是否正确"
    echo "4. 防火墙是否允许SSH连接"
    exit 1
fi

# 第四步：开始部署
echo ""
echo -e "${GREEN}🚀 第四步：开始自动部署${NC}"
echo "================================================"

echo -e "${YELLOW}⏳ 正在打包项目文件...${NC}"

# 打包项目
tar -czf dreamhome-deploy.tar.gz \
    --exclude=node_modules \
    --exclude=.svelte-kit \
    --exclude=.git \
    --exclude="*.log" \
    --exclude=dreamhome-deploy.tar.gz \
    . 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 项目打包完成${NC}"
else
    echo -e "${RED}❌ 项目打包失败${NC}"
    exit 1
fi

echo -e "${YELLOW}⏳ 正在上传文件到服务器...${NC}"

# 上传文件
scp -o ConnectTimeout=30 dreamhome-deploy.tar.gz root@$SERVER_IP:/tmp/ 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 文件上传完成${NC}"
else
    echo -e "${RED}❌ 文件上传失败，请检查网络连接${NC}"
    exit 1
fi

echo -e "${YELLOW}⏳ 正在服务器上安装环境和部署应用...${NC}"
echo -e "${YELLOW}这个过程需要5-10分钟，请耐心等待...${NC}"

# 服务器端部署
ssh root@$SERVER_IP << EOF
set -e

echo "🏗️  开始服务器环境配置..."

# 更新系统
echo "📦 更新系统包..."
export DEBIAN_FRONTEND=noninteractive
apt update -y
apt upgrade -y

# 安装基础工具
apt install -y curl wget git build-essential

# 安装Node.js
echo "📦 安装Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

echo "Node.js版本: \$(node --version)"
echo "npm版本: \$(npm --version)"

# 安装PostgreSQL
echo "🗃️  安装PostgreSQL数据库..."
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    
    # 设置数据库密码
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
    sudo -u postgres createdb dreamhome 2>/dev/null || echo "数据库已存在"
    sudo -u postgres createdb dreamhome_shadow 2>/dev/null || echo "Shadow数据库已存在"
fi

# 安装Nginx
echo "🌐 安装Nginx网页服务器..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
fi

# 安装PM2和Prisma
echo "⚙️  安装进程管理器和数据库工具..."
npm install -g pm2 prisma

# 创建项目目录
echo "📁 准备项目目录..."
mkdir -p /var/www/dreamhome
cd /var/www/dreamhome

# 解压项目文件  
echo "📂 解压项目文件..."
tar -xzf /tmp/dreamhome-deploy.tar.gz
rm /tmp/dreamhome-deploy.tar.gz

# 安装项目依赖
echo "📦 安装项目依赖..."
npm install --production
npm install express

# 创建环境配置
cat > .env.production << 'ENVEOF'
NODE_ENV=production
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dreamhome
JWT_SECRET=dream-home-super-secret-jwt-key-2024-production
DOUBAO_API_KEY=97e3922f-c817-47d3-8690-6a940a06081f
PUBLIC_APP_URL=$PUBLIC_URL
PORT=3000
ENVEOF

# 数据库初始化
echo "🗃️  初始化数据库..."
npm run prisma:generate
npm run prisma:push --accept-data-loss
npm run prisma:seed || echo "种子数据已存在"

# 构建项目
echo "🔨 构建生产版本..."
npm run build

# 创建启动脚本
cat > start-production.js << 'JSEOF'
import { handler } from './build/handler.js';
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/dreamhome';
process.env.JWT_SECRET = 'dream-home-super-secret-jwt-key-2024-production';
process.env.DOUBAO_API_KEY = '97e3922f-c817-47d3-8690-6a940a06081f';
process.env.PUBLIC_APP_URL = '$PUBLIC_URL';

app.use(handler);

app.listen(port, () => {
  console.log(\`🚀 狗狗造梦家服务器运行在端口 \${port}\`);
});
JSEOF

# 创建PM2配置
cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'dreamhome',
    script: 'start-production.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
PM2EOF

mkdir -p logs

# 配置Nginx
cat > /etc/nginx/sites-available/dreamhome << 'NGINXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

# 启用网站配置
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/dreamhome /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# 配置防火墙
ufw allow ssh
ufw allow 80
ufw allow 443
echo "y" | ufw enable

# 启动应用
echo "🚀 启动狗狗造梦家应用..."
pm2 start ecosystem.config.js
pm2 startup | tail -1 | bash
pm2 save

# 设置权限
chown -R www-data:www-data /var/www/dreamhome

echo "✅ 部署完成！"
EOF

# 清理本地文件
rm -f dreamhome-deploy.tar.gz

# 部署完成
echo ""
echo -e "${GREEN}🎉 ===============================🎉${NC}"
echo -e "${GREEN}        部署成功完成！${NC}"
echo -e "${GREEN}🎉 ===============================🎉${NC}"
echo ""
echo -e "${BLUE}🌐 您的网站地址：${NC}"
echo -e "${YELLOW}   $PUBLIC_URL${NC}"
echo ""
echo -e "${BLUE}🔑 管理后台地址：${NC}"
echo -e "${YELLOW}   $PUBLIC_URL/admin${NC}"
echo ""
echo -e "${BLUE}📋 常用管理命令：${NC}"
echo "   ssh root@$SERVER_IP        # 连接服务器"
echo "   pm2 status                 # 查看应用状态"
echo "   pm2 logs dreamhome         # 查看应用日志"
echo "   pm2 restart dreamhome      # 重启应用"
echo ""
echo -e "${GREEN}🎯 下一步建议：${NC}"
if [[ $HAS_DOMAIN == "y" || $HAS_DOMAIN == "Y" ]]; then
    echo "1. 配置域名DNS解析指向服务器IP: $SERVER_IP"
    echo "2. 安装SSL证书（HTTPS）"
else
    echo "1. 申请域名并备案"
    echo "2. 配置域名DNS解析"
    echo "3. 安装SSL证书"
fi
echo ""
echo -e "${YELLOW}💡 现在可以用浏览器访问您的网站了！${NC}" 