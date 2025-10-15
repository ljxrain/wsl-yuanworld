#!/bin/bash
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}开始在WSL中配置Yuan World项目${NC}"
echo -e "${BLUE}=========================================${NC}"

# 获取当前脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "\n${GREEN}项目目录: $SCRIPT_DIR${NC}\n"

# 第1步：更新系统包
echo -e "${YELLOW}步骤 1/10: 更新系统包...${NC}"
sudo apt update && sudo apt upgrade -y

# 第2步：安装必要的工具
echo -e "\n${YELLOW}步骤 2/10: 安装必要工具...${NC}"
sudo apt install -y curl wget git build-essential

# 第3步：安装PostgreSQL
echo -e "\n${YELLOW}步骤 3/10: 安装PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    echo -e "${GREEN}PostgreSQL安装完成${NC}"
else
    echo -e "${GREEN}PostgreSQL已安装: $(psql --version)${NC}"
fi

# 第4步：启动PostgreSQL服务
echo -e "\n${YELLOW}步骤 4/10: 启动PostgreSQL服务...${NC}"
sudo service postgresql start
sleep 2

# 检查PostgreSQL服务状态
if sudo service postgresql status | grep -q "running"; then
    echo -e "${GREEN}PostgreSQL服务运行正常${NC}"
else
    echo -e "${RED}警告: PostgreSQL服务可能未正常启动${NC}"
fi

# 第5步：创建数据库和用户
echo -e "\n${YELLOW}步骤 5/10: 创建数据库和用户...${NC}"
sudo -u postgres psql -c "DROP DATABASE IF EXISTS yuan_world;" || true
sudo -u postgres psql -c "CREATE DATABASE yuan_world;"
sudo -u postgres psql -c "CREATE USER ljxrain WITH PASSWORD 'postgres';" || echo "用户可能已存在"
sudo -u postgres psql -c "ALTER USER ljxrain WITH SUPERUSER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE yuan_world TO ljxrain;"
echo -e "${GREEN}数据库创建完成${NC}"

# 第6步：导入数据库
echo -e "\n${YELLOW}步骤 6/10: 导入数据库备份...${NC}"
if [ -f "yuan_world_full.dump" ]; then
    echo "正在导入数据库..."
    sudo -u postgres pg_restore -d yuan_world -v yuan_world_full.dump 2>&1 | grep -v "^processing" || true
    echo -e "${GREEN}数据库导入完成${NC}"

    # 验证数据导入
    TABLE_COUNT=$(sudo -u postgres psql -d yuan_world -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    echo -e "${GREEN}导入了 $TABLE_COUNT 个表${NC}"
else
    echo -e "${RED}错误: 找不到 yuan_world_full.dump 文件${NC}"
    echo -e "${YELLOW}请确保数据库dump文件在项目根目录${NC}"
    exit 1
fi

# 第7步：安装Node.js
echo -e "\n${YELLOW}步骤 7/10: 安装Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "正在安装Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    echo -e "${GREEN}Node.js安装完成${NC}"
else
    echo -e "${GREEN}Node.js已安装: $(node -v)${NC}"
    echo -e "${GREEN}npm版本: $(npm -v)${NC}"
fi

# 第8步：安装npm依赖
echo -e "\n${YELLOW}步骤 8/10: 安装项目依赖...${NC}"
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}依赖安装完成${NC}"
else
    echo -e "${RED}错误: 找不到 package.json 文件${NC}"
    exit 1
fi

# 第9步：配置环境变量
echo -e "\n${YELLOW}步骤 9/10: 配置环境变量...${NC}"
if [ ! -f .env ]; then
    if [ -f env.example ]; then
        cp env.example .env
        echo -e "${GREEN}已从 env.example 创建 .env 文件${NC}"
    else
        echo -e "${RED}错误: 找不到 env.example 文件${NC}"
        exit 1
    fi
fi

# 更新.env文件中的数据库连接信息（保留老张API配置）
sed -i 's/DB_HOST=.*/DB_HOST=localhost/' .env
sed -i 's/DB_PORT=.*/DB_PORT=5432/' .env
sed -i 's/DB_USER=.*/DB_USER=ljxrain/' .env
sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=postgres/' .env
sed -i 's/DB_NAME=.*/DB_NAME=yuan_world/' .env

# 确保老张API配置存在（如果不存在则添加）
if ! grep -q "LAOZHANG_API_URL" .env; then
    echo "" >> .env
    echo "# 老张API配置 - Nano Banana图像合成" >> .env
    echo "LAOZHANG_API_URL=https://api.laozhang.ai/v1/chat/completions" >> .env
    echo "LAOZHANG_API_KEY=sk-NyROY2ZdW7yOdgmJDc57Cb204eB448CbA8B0Cd476849F165" >> .env
fi

echo -e "${GREEN}.env 配置完成（已保留老张API配置）${NC}"

# 第10步：创建必要的目录
echo -e "\n${YELLOW}步骤 10/10: 创建必要的目录...${NC}"
mkdir -p public/images/generations/originals
mkdir -p public/images/generations/previews
mkdir -p uploads
echo -e "${GREEN}目录创建完成${NC}"

# 设置目录权限
chmod -R 755 public/images
chmod -R 755 uploads

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}✅ WSL环境配置完成！${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo -e "${YELLOW}数据库信息：${NC}"
echo "  主机: localhost"
echo "  端口: 5432"
echo "  用户: ljxrain"
echo "  密码: postgres"
echo "  数据库: yuan_world"
echo ""
echo -e "${YELLOW}服务器配置：${NC}"
echo "  端口: 8080"
echo "  环境: development"
echo ""
echo -e "${YELLOW}下一步操作：${NC}"
echo "  1. 测试数据库连接: ${GREEN}node -e \"require('./server/config/database-instance.js').sequelize.authenticate().then(() => console.log('数据库连接成功')).catch(err => console.error('连接失败:', err))\"${NC}"
echo "  2. 启动服务器: ${GREEN}npm start${NC}"
echo "  3. 或使用开发模式: ${GREEN}npm run dev${NC}"
echo "  4. 访问网站: ${GREEN}http://localhost:8080${NC}"
echo ""
echo -e "${YELLOW}提示：${NC}"
echo "  - 如需重启PostgreSQL: ${GREEN}sudo service postgresql restart${NC}"
echo "  - 查看PostgreSQL状态: ${GREEN}sudo service postgresql status${NC}"
echo "  - 查看日志: ${GREEN}tail -f /var/log/postgresql/postgresql-*-main.log${NC}"
echo ""


