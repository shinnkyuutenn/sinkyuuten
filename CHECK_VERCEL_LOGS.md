# 🔍 Vercel Function 崩溃诊断指南

## 当前错误
```
FUNCTION_INVOCATION_FAILED
500: INTERNAL_SERVER_ERROR
```

这表示 Serverless Function 在运行时崩溃了。

## 立即检查步骤

### 1. 查看详细的函数日志（最重要）

**步骤**：
1. 登录 Vercel Dashboard
2. 进入项目 → **Deployments**
3. 选择最新的部署
4. 点击 **"Function Logs"** 或 **"View Function Logs"**
5. **查找最新的错误信息**

**关键信息**：
- Python 运行时错误
- 数据库连接错误
- 导入错误
- 任何 Traceback 信息

### 2. 检查环境变量

确认 `NEON_DATABASE_URL` 已正确设置：
- 项目 → **Settings** → **Environment Variables**
- 确认变量存在
- 确认值正确（完整连接字符串）
- 确认在所有环境都已设置

### 3. 测试最简单的端点

访问测试端点：
```
https://sinkyuuten1.vercel.app/api/test-db
```

如果这个端点也失败，说明是基础配置问题。

---

## 常见崩溃原因

### 原因 1: 数据库连接失败

**症状**：日志中显示 `psycopg2.OperationalError` 或连接超时

**解决方案**：
1. 检查 `NEON_DATABASE_URL` 环境变量
2. 确认连接字符串格式正确
3. 在 Neon 控制台检查数据库状态

### 原因 2: 模块导入错误

**症状**：日志中显示 `ModuleNotFoundError`

**解决方案**：
- 检查 `requirements.txt` 是否包含所有依赖
- 确认 Vercel 构建日志中依赖安装成功

### 原因 3: Flask 应用初始化错误

**症状**：日志中显示 Flask 相关错误

**解决方案**：
- 检查 `app.py` 中的路由配置
- 确认所有 Blueprint 正确注册

### 原因 4: 路径问题

**症状**：日志中显示 `FileNotFoundError` 或路径相关错误

**解决方案**：
- 确认 `api/index.py` 中的路径设置正确
- 确认静态文件路径配置正确

---

## 调试技巧

### 添加更多日志

如果日志不够详细，可以在 `api/index.py` 中添加：

```python
import sys
print("Python 路径:", sys.path)
print("当前工作目录:", os.getcwd())
print("环境变量 NEON_DATABASE_URL 存在:", bool(os.getenv('NEON_DATABASE_URL')))
```

### 测试数据库连接

在 `api/index.py` 中添加测试：

```python
try:
    from db import get_connection
    conn = get_connection()
    print("✅ 数据库连接成功")
    conn.close()
except Exception as e:
    print(f"❌ 数据库连接失败: {e}")
    import traceback
    traceback.print_exc()
```

---

## 下一步

1. **查看 Vercel Function Logs**，找到具体的错误信息
2. **将错误日志发给我**，我可以帮你进一步诊断
3. **检查环境变量**，确认 `NEON_DATABASE_URL` 已设置

---

## 如果仍然无法解决

请提供以下信息：
1. Vercel Function Logs 中的完整错误信息（包括 Traceback）
2. 构建日志中是否有警告或错误
3. 环境变量是否已正确设置

有了这些信息，我可以更准确地定位问题。

