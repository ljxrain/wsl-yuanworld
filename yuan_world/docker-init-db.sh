#!/bin/bash
# Docker数据库初始化脚本
# 此脚本在postgres容器首次启动时自动执行

set -e

# 等待PostgreSQL完全启动
echo "等待PostgreSQL启动..."
until pg_isready -U ljxrain -d yuan_world; do
  echo "PostgreSQL未就绪，等待中..."
  sleep 2
done

echo "PostgreSQL已就绪"

# 检查是否存在备份文件
if [ -f "/docker-entrypoint-initdb.d/backup.dump" ]; then
    echo "发现数据库备份文件，开始导入..."

    # 导入数据库
    pg_restore -U ljxrain -d yuan_world -v /docker-entrypoint-initdb.d/backup.dump 2>&1 || {
        echo "数据库导入完成（可能有一些警告）"
    }

    echo "数据库初始化完成"
else
    echo "警告：未找到数据库备份文件"
    echo "数据库将为空，需要手动导入数据或运行迁移脚本"
fi
