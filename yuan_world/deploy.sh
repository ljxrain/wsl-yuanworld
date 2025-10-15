#!/bin/bash
# Yuan World 一键部署脚本
# 用于快速在服务器上部署或更新应用

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Yuan World 部署脚本${NC}"
echo -e "${BLUE}=========================================${NC}"

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker未安装${NC}"
    echo "请先安装Docker: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}错误: Docker Compose未安装${NC}"
    echo "请先安装Docker Compose"
    exit 1
fi

echo -e "${GREEN}Docker环境检查通过${NC}"

# 检查环境配置文件
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}警告: 未找到 .env.production 文件${NC}"
    if [ -f .env.docker ]; then
        echo -e "${YELLOW}从 .env.docker 创建 .env.production${NC}"
        cp .env.docker .env.production
        echo -e "${RED}请编辑 .env.production 并填写正确的配置！${NC}"
        echo -e "${YELLOW}特别注意修改以下配置：${NC}"
        echo "  - JWT_SECRET"
        echo "  - DB_PASSWORD"
        echo "  - LAOZHANG_API_KEY"
        echo ""
        read -p "按Enter继续编辑配置文件..."
        ${EDITOR:-nano} .env.production
    else
        echo -e "${RED}错误: 找不到环境配置文件${NC}"
        exit 1
    fi
fi

# 检查数据库dump文件
if [ ! -f yuan_world_full.dump ]; then
    echo -e "${YELLOW}警告: 未找到数据库dump文件 yuan_world_full.dump${NC}"
    read -p "是否继续部署？(容器将使用空数据库) [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 显示菜单
echo ""
echo -e "${YELLOW}请选择操作：${NC}"
echo "1) 首次部署（构建镜像并启动）"
echo "2) 更新应用（重新构建并重启）"
echo "3) 仅重启服务"
echo "4) 停止服务"
echo "5) 查看日志"
echo "6) 查看服务状态"
echo "7) 备份数据库"
echo "8) 清理Docker资源"
echo "0) 退出"
echo ""
read -p "请输入选项 [0-8]: " choice

case $choice in
    1)
        echo -e "\n${YELLOW}开始首次部署...${NC}"

        # 构建镜像
        echo -e "${YELLOW}步骤 1/3: 构建Docker镜像...${NC}"
        docker build -t yuan-world:latest .

        # 启动服务
        echo -e "${YELLOW}步骤 2/3: 启动服务...${NC}"
        docker-compose --env-file .env.production up -d

        # 等待服务启动
        echo -e "${YELLOW}步骤 3/3: 等待服务启动...${NC}"
        sleep 10

        # 检查服务状态
        docker-compose ps

        echo -e "\n${GREEN}✅ 部署完成！${NC}"
        echo -e "${YELLOW}访问地址: http://localhost:8080${NC}"
        echo -e "${YELLOW}查看日志: docker-compose logs -f${NC}"
        ;;

    2)
        echo -e "\n${YELLOW}开始更新应用...${NC}"

        # 拉取最新代码（如果是git仓库）
        if [ -d .git ]; then
            echo -e "${YELLOW}步骤 1/4: 拉取最新代码...${NC}"
            git pull
        fi

        # 重新构建镜像
        echo -e "${YELLOW}步骤 2/4: 重新构建镜像...${NC}"
        docker build -t yuan-world:latest .

        # 重启服务
        echo -e "${YELLOW}步骤 3/4: 重启服务...${NC}"
        docker-compose --env-file .env.production up -d --force-recreate app

        # 等待服务启动
        echo -e "${YELLOW}步骤 4/4: 等待服务启动...${NC}"
        sleep 5

        # 检查服务状态
        docker-compose ps

        echo -e "\n${GREEN}✅ 更新完成！${NC}"
        ;;

    3)
        echo -e "\n${YELLOW}重启服务...${NC}"
        docker-compose restart
        echo -e "${GREEN}✅ 服务已重启${NC}"
        docker-compose ps
        ;;

    4)
        echo -e "\n${YELLOW}停止服务...${NC}"
        docker-compose stop
        echo -e "${GREEN}✅ 服务已停止${NC}"
        ;;

    5)
        echo -e "\n${YELLOW}显示日志（Ctrl+C 退出）...${NC}"
        docker-compose logs -f
        ;;

    6)
        echo -e "\n${YELLOW}服务状态：${NC}"
        docker-compose ps
        echo ""
        echo -e "${YELLOW}容器资源使用：${NC}"
        docker stats --no-stream
        ;;

    7)
        echo -e "\n${YELLOW}备份数据库...${NC}"
        BACKUP_DIR="$HOME/backups"
        mkdir -p "$BACKUP_DIR"
        BACKUP_FILE="$BACKUP_DIR/yuan_world_$(date +%Y%m%d_%H%M%S).dump"

        docker exec yuan_world_db pg_dump -U ljxrain -F c yuan_world > "$BACKUP_FILE"

        if [ -f "$BACKUP_FILE" ]; then
            echo -e "${GREEN}✅ 备份成功: $BACKUP_FILE${NC}"
            ls -lh "$BACKUP_FILE"
        else
            echo -e "${RED}❌ 备份失败${NC}"
        fi
        ;;

    8)
        echo -e "\n${RED}警告: 这将删除未使用的Docker镜像、容器、网络和卷${NC}"
        read -p "确定要继续吗？[y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker system prune -a
            echo -e "${GREEN}✅ 清理完成${NC}"
        fi
        ;;

    0)
        echo "退出"
        exit 0
        ;;

    *)
        echo -e "${RED}无效的选项${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}操作完成${NC}"
echo -e "${BLUE}=========================================${NC}"
