#!/bin/bash

# 手机部署脚本
# 此脚本会自动获取局域网IP并配置环境变量

echo "🚀 开始手机部署配置..."

# 获取局域网IP地址
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$IP" ]; then
    echo "❌ 无法获取局域网IP地址"
    exit 1
fi

echo "📱 检测到局域网IP: $IP"

# 创建.env.local文件
cat > .env.local << EOF
# 手机访问配置 - 自动生成
VITE_API_BASE_URL=http://$IP:3001
EOF

echo "✅ 已创建 .env.local 文件"
echo ""
echo "📋 配置信息："
echo "   前端地址: http://$IP:5173"
echo "   后端API: http://$IP:3001"
echo ""
echo "📱 在手机浏览器中访问: http://$IP:5173"
echo ""
echo "⚠️  请确保："
echo "   1. 手机和电脑连接到同一个Wi-Fi"
echo "   2. 防火墙允许端口 3001 和 5173"
echo "   3. 后端服务器已启动 (npm run server)"
echo ""
echo "现在可以运行: npm run dev"

