#!/bin/bash

echo "🚀 启动 MD Editor Webhook 代理服务器"
echo "=================================="

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

# 检查端口是否被占用
if lsof -i :3001 &> /dev/null; then
    echo "⚠️  端口 3001 已被占用，尝试终止现有进程..."
    lsof -i :3001 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
    sleep 2
fi

# 启动服务器
echo "🚀 启动服务器..."
npm start