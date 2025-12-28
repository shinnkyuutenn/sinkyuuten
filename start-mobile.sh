#!/bin/bash
# 手机端部署启动脚本

echo "🚀 正在启动服务以支持手机端访问..."
echo ""

# 获取本机IP地址
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$IP" ]; then
    IP=$(ipconfig getifaddr en0 2>/dev/null || echo "未找到IP地址")
fi

echo "📍 本机IP地址: $IP"
echo ""
echo "📱 请在手机浏览器中访问:"
echo "   http://$IP:5173"
echo ""
echo "⚠️  请确保："
echo "   1. 手机和电脑连接到同一个WiFi网络"
echo "   2. 防火墙允许端口5173和5001的访问"
echo ""
echo "正在检查服务状态..."
echo ""

# 检查Flask服务器是否已经在运行
if lsof -ti:5001 > /dev/null 2>&1; then
    echo "✅ Flask服务器(端口5001)已经在运行 (PID: $(lsof -ti:5001))"
else
    echo "🔄 启动Flask服务器(端口5001)..."
    python3 app.py > flask.log 2>&1 &
    FLASK_PID=$!
    echo "   Flask服务器已启动 (PID: $FLASK_PID)"
    sleep 2
fi

# 检查Vite服务器是否已经在运行
if lsof -ti:5173 > /dev/null 2>&1; then
    echo "✅ Vite开发服务器(端口5173)已经在运行 (PID: $(lsof -ti:5173))"
    echo ""
    echo "服务已就绪！可以在手机浏览器中访问了。"
    echo ""
else
    echo "🔄 启动Vite开发服务器(端口5173)..."
    echo ""
    npm run dev
fi

