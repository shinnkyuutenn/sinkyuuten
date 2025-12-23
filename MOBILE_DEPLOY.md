# 手机部署指南

## 📱 手机访问配置

### 1. 确保所有服务正在运行

在项目根目录下，需要启动三个服务：

#### 启动 Node.js 服务器（端口 3001）
```bash
npm run server
```

#### 启动 Flask 服务器（端口 5001）
```bash
python3 app.py
```

#### 启动 Vite 开发服务器（端口 5173）
```bash
npm run dev
```

### 2. 获取本机IP地址

在终端运行以下命令获取本机IP地址：

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

或者：
```bash
ipconfig getifaddr en0
```

**Windows:**
```cmd
ipconfig
```
查找 "IPv4 地址" 或 "IPv4 Address"

### 3. 手机访问

确保手机和电脑连接到**同一个WiFi网络**。

在手机浏览器中访问：
```
http://[你的IP地址]:5173
```

例如：
```
http://172.27.176.118:5173
```

### 4. 防火墙设置

如果无法访问，可能需要允许防火墙通过：

**macOS:**
- 系统设置 > 网络 > 防火墙 > 选项
- 允许传入连接

**Windows:**
- 控制面板 > Windows Defender 防火墙 > 允许应用通过防火墙
- 允许 Node.js、Python、Vite 通过防火墙

### 5. 常见问题

#### 问题：手机无法访问
- ✅ 确保手机和电脑在同一WiFi网络
- ✅ 检查防火墙设置
- ✅ 确认所有服务都在运行
- ✅ 尝试使用IP地址而不是localhost

#### 问题：API请求失败
- ✅ 确保 Vite 代理配置正确（`vite.config.js`）
- ✅ 检查后端服务是否正常运行
- ✅ 查看浏览器控制台的错误信息

### 6. 服务配置说明

所有服务已配置为允许局域网访问：

- **Vite (端口 5173)**: `host: '0.0.0.0'` ✅
- **Node.js (端口 3001)**: `app.listen(port, '0.0.0.0')` ✅
- **Flask (端口 5001)**: `host='0.0.0.0'` ✅

### 7. 快速启动脚本

可以创建一个启动脚本同时启动所有服务（可选）：

**start-all.sh (macOS/Linux):**
```bash
#!/bin/bash
# 启动所有服务
npm run server &
python3 app.py &
npm run dev
```

**start-all.bat (Windows):**
```batch
@echo off
start "Node Server" cmd /k npm run server
start "Flask Server" cmd /k python app.py
start "Vite Dev" cmd /k npm run dev
```

