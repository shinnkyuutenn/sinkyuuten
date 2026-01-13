# 🔍 Vercel 500 错误调试指南

## 当前问题
API 请求返回 500 错误，且返回的是 HTML（`<!doctype`），说明请求被路由到了前端页面而不是 Flask API。

## 立即检查步骤

### 1. 查看 Vercel 函数日志

**步骤**：
1. 登录 Vercel Dashboard
2. 进入你的项目
3. 点击 **"Deployments"** 标签
4. 选择最新的部署
5. 点击 **"Function Logs"** 或 **"View Function Logs"**

**查找**：
- Python 导入错误
- 数据库连接错误
- Flask 应用初始化错误

### 2. 测试数据库连接端点

访问以下 URL（替换为你的域名）：
```
https://你的域名.vercel.app/api/test-db
```

**预期结果**：
- ✅ 成功：返回 JSON，包含 `{"status": "success", ...}`
- ❌ 失败：返回 500 或错误信息

### 3. 检查环境变量

在 Vercel Dashboard：
1. 项目 → **Settings** → **Environment Variables**
2. 确认 `NEON_DATABASE_URL` 存在
3. 确认值正确（完整连接字符串）
4. 确认在所有环境（Production/Preview/Development）都已设置

### 4. 验证 Vercel 项目设置

在 Vercel Dashboard → 项目 → **Settings** → **General**：

**Build & Development Settings**：
- **Framework Preset**: `Other` 或 `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**注意**：如果 `vercel.json` 中定义了 `buildCommand`，项目设置中的值会被忽略。

---

## 如果问题仍然存在

### 方案 A: 检查 Vercel 是否识别了 Python 函数

在 Vercel Dashboard → **Deployments** → 最新部署 → **Functions**：

应该能看到：
- `api/index.py` 函数已创建
- 函数状态为 "Ready" 或 "Error"

如果函数不存在或状态为 Error，说明 Vercel 没有正确识别 Python 函数。

### 方案 B: 简化配置测试

如果当前配置不工作，可以尝试更简单的配置：

**创建 `vercel.json`**（简化版）：
```json
{
  "rewrites": [
    {
      "source": "/(api|auth|recommend|shop|review_json|search_shops_json|upload-image|articles|recommended|static|src/uploads)/(.*)",
      "destination": "/api/index"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 方案 C: 检查 requirements.txt

确认 `requirements.txt` 包含所有依赖：
```txt
Flask==3.0.3
Flask-Cors==4.0.1
psycopg2-binary==2.9.9
python-dotenv==1.0.1
```

### 方案 D: 查看构建日志

在 Vercel Dashboard → **Deployments** → 最新部署 → **Build Logs**：

检查：
- Python 依赖是否成功安装
- 是否有构建错误
- `dist` 目录是否成功创建

---

## 常见错误和解决方案

### 错误：`ModuleNotFoundError: No module named 'app'`

**原因**：Python 路径问题

**解决方案**：`api/index.py` 中已添加路径设置，如果仍有问题，检查：
```python
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
```

### 错误：`psycopg2.OperationalError`

**原因**：数据库连接失败

**解决方案**：
1. 检查 `NEON_DATABASE_URL` 环境变量
2. 验证连接字符串格式
3. 在 Neon 控制台检查数据库状态

### 错误：返回 HTML 而不是 JSON

**原因**：API 路由没有正确工作，请求被路由到前端

**解决方案**：
1. 检查 `vercel.json` 中的 `rewrites` 配置
2. 确认 `api/index.py` 存在且格式正确
3. 确认 Vercel 识别了 Python 函数

---

## 下一步

1. **查看 Vercel 函数日志**，找到具体错误信息
2. **测试 `/api/test-db` 端点**，验证数据库连接
3. **检查环境变量**，确认 `NEON_DATABASE_URL` 已设置
4. **如果仍有问题**，将 Vercel 日志中的错误信息发给我

---

## 快速测试命令

在浏览器控制台测试：

```javascript
// 测试数据库连接
fetch('/api/test-db')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// 测试餐厅 API
fetch('/api/restaurants')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

