#!/bin/bash

echo "🚀 完成狗狗造梦家部署配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 设置工作目录
cd /opt

echo "📦 等待依赖安装完成..."
while [ ! -d "node_modules" ]; do
    echo "⏳ 依赖安装中，请稍候..."
    sleep 10
done

echo "✅ 依赖安装完成"

echo "🗄️ 配置数据库..."
# 创建数据库用户和数据库
sudo -u postgres psql -c "CREATE USER dreamhome WITH PASSWORD 'dreamhome123';" 2>/dev/null || echo "用户已存在"
sudo -u postgres psql -c "CREATE DATABASE dreamhome OWNER dreamhome;" 2>/dev/null || echo "数据库已存在"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dreamhome TO dreamhome;" 2>/dev/null

echo "🔧 配置环境变量..."
cat > .env << EOF
# 数据库配置
DATABASE_URL="postgresql://dreamhome:dreamhome123@localhost:5432/dreamhome"

# JWT密钥
JWT_SECRET="your-super-secret-jwt-key-here-make-it-very-long-and-random"

# 豆包API配置 (需要用户配置)
DOUBAO_API_KEY="your-doubao-api-key-here"
DOUBAO_ENDPOINT="https://ark.cn-beijing.volces.com/api/v3"

# 服务器配置
PORT=3000
NODE_ENV=production
EOF

echo "🗄️ 运行数据库迁移..."
npx prisma generate
npx prisma db push
npx prisma db seed

echo "🏗️ 构建项目..."
npm run build

echo "📦 安装PM2..."
sudo npm install -g pm2

echo "🚀 启动应用..."
pm2 start npm --name "dreamhome" -- start

echo "🌐 配置Nginx..."
sudo apt-get update
sudo apt-get install -y nginx

# 创建Nginx配置
sudo tee /etc/nginx/sites-available/dreamhome << EOF
server {
    listen 80;
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
EOF

# 启用站点
sudo ln -sf /etc/nginx/sites-available/dreamhome /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "🔥 配置防火墙..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "✅ 部署完成!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 访问地址: http://49.232.220.223"
echo "📋 后续配置:"
echo "   1. 编辑 /opt/.env 文件，配置豆包API密钥"
echo "   2. 重启应用: pm2 restart dreamhome"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 