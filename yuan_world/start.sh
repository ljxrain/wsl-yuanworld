#!/bin/bash

echo "🚀 正在启动源世界应用..."
echo ""

# 检查 PostgreSQL 是否运行
echo "📊 检查 PostgreSQL 状态..."
if ! pg_isready -U postgres > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL 未运行，尝试启动..."
    sudo service postgresql start
    sleep 2
fi

if pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL 运行正常"
else
    echo "❌ PostgreSQL 启动失败，请手动启动"
    exit 1
fi

# 检查数据库是否存在
echo ""
echo "📊 检查数据库..."
if psql -U ljxrain -lqt | cut -d \| -f 1 | grep -qw yuan_world; then
    echo "✅ 数据库 yuan_world 存在"
else
    echo "❌ 数据库 yuan_world 不存在"
    exit 1
fi

# 启动应用
echo ""
echo "🎯 启动应用服务器..."
echo ""
node server/index.js
