#!/bin/bash
# 手机端部署脚本 - 生产环境

echo "🚀 开始手机端部署..."
echo ""

# 获取本机IP地址
get_ip() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
    else
        # Linux
        IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "")
    fi
    
    if [ -z "$IP" ]; then
        IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    fi
    
    echo "$IP"
}

IP=$(get_ip)

if [ -z "$IP" ]; then
    echo "❌ 无法获取本机IP地址"
    exit 1
fi

echo "📍 本机IP地址: $IP"
echo ""

# 1. 构建前端
echo "📦 正在构建前端应用..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败"
    exit 1
fi

echo "✅ 前端构建完成"
echo ""

# 2. 检查并停止已运行的服务
echo "🔄 检查已运行的服务..."

# 停止Flask服务器
if lsof -ti:5001 > /dev/null 2>&1; then
    echo "   停止Flask服务器 (端口5001)..."
    kill $(lsof -ti:5001) 2>/dev/null
    sleep 1
fi

# 停止Vite服务器（如果有）
if lsof -ti:5173 > /dev/null 2>&1; then
    echo "   停止Vite服务器 (端口5173)..."
    kill $(lsof -ti:5173) 2>/dev/null
    sleep 1
fi

echo ""

# 3. 启动Flask服务器（生产模式）
echo "🚀 启动Flask服务器..."
echo "   端口: 5001"
echo "   模式: 生产环境"
echo ""

# 后台运行Flask
python3 app.py > flask.log 2>&1 &
FLASK_PID=$!

# 等待Flask启动
sleep 3

# 检查Flask是否成功启动
if ps -p $FLASK_PID > /dev/null; then
    echo "✅ Flask服务器已启动 (PID: $FLASK_PID)"
else
    echo "❌ Flask服务器启动失败，请查看 flask.log"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 部署完成！"
echo ""
echo "📱 请在手机浏览器中访问:"
echo "   http://$IP:5001"
echo ""
echo "⚠️  请确保："
echo "   1. 手机和电脑连接到同一个WiFi网络"
echo "   2. 防火墙允许端口5001的访问"
echo "   3. 如果无法访问，请检查防火墙设置"
echo ""
echo "📝 查看日志: tail -f flask.log"
echo "🛑 停止服务: kill $FLASK_PID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

