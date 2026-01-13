# 🔍 Vercel 构建检查清单

## 当前问题
`requests` 模块仍然没有被安装，即使 `api/requirements.txt` 已存在。

## 需要检查的事项

### 1. 检查构建日志（最重要）

在 Vercel Dashboard：
1. 进入项目 → **Deployments**
2. 选择最新部署
3. 点击 **"Build Logs"**（不是 Function Logs）
4. **查找以下信息**：

**应该看到**：
```
Installing dependencies from api/requirements.txt
Collecting requests==2.31.0
Successfully installed requests-2.31.0
```

**如果没有看到**：
- 说明 Vercel 没有识别 `api/requirements.txt`
- 或者构建时没有安装 Python 依赖

### 2. 检查函数配置

在 Vercel Dashboard → 项目 → **Settings** → **Functions**：

确认：
- `api/index.py` 被识别为 Python function
- Runtime 设置为 `python3.11`（或类似）

### 3. 清除缓存并重新构建

如果构建日志显示依赖没有被安装：

1. **清除构建缓存**：
   - 项目 → **Settings** → **General**
   - 滚动到底部
   - 点击 **"Clear Build Cache"**

2. **强制重新部署**：
   - **Deployments** → 最新部署 → "..." → **"Redeploy"**

### 4. 验证 requirements.txt 格式

确认 `api/requirements.txt` 格式正确：
```
Flask==3.0.3
Flask-Cors==4.0.1
psycopg2-binary==2.9.9
python-dotenv==1.0.1
requests==2.31.0
```

**注意**：
- 每行一个包
- 使用 `==` 指定版本
- 没有空行或注释（或注释以 `#` 开头）

### 5. 检查文件位置

确认文件结构：
```
sinkyuuten/
├── api/
│   ├── index.py
│   └── requirements.txt  ← 必须在这里
├── requirements.txt      ← 根目录也有
└── vercel.json
```

---

## 如果构建日志显示依赖已安装

如果构建日志显示 `requests` 已安装，但运行时仍然报错，可能是：

1. **代码缓存问题**：Vercel 使用了旧的代码
2. **Python 路径问题**：模块安装在不同的位置

**解决方案**：
- 清除缓存并重新部署
- 检查 Python 版本是否匹配

---

## 下一步

**请提供构建日志**（Build Logs），特别是：
- 是否有 "Installing dependencies" 的消息
- 是否有 "Successfully installed requests" 的消息
- 是否有任何错误或警告

有了构建日志，我可以更准确地诊断问题。

