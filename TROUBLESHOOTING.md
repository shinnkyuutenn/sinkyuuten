# 🔧 故障排除指南 - 500 错误

## 问题：部署后出现 500 错误，无法读取数据

### 可能的原因和解决方案

#### 1. 检查 Vercel 函数日志

**步骤**：
1. 登录 Vercel Dashboard
2. 进入你的项目
3. 点击 **"Deployments"** 标签
4. 选择最新的部署
5. 点击 **"Function Logs"** 或 **"View Function Logs"**

**查找**：
- 数据库连接错误
- Python 导入错误
- 环境变量未找到的错误

---

#### 2. 验证环境变量

**检查环境变量是否正确设置**：

1. 进入项目 → **Settings** → **Environment Variables**
2. 确认 `NEON_DATABASE_URL` 存在
3. 确认值正确（包含完整的连接字符串）
4. 确认在所有环境（Production, Preview, Development）都已设置

**测试连接字符串**：
```bash
# 在本地测试
export NEON_DATABASE_URL="你的连接字符串"
python3 -c "from db import get_connection; conn = get_connection(); print('✅ 连接成功'); conn.close()"
```

---

#### 3. 检查数据库连接字符串格式

**问题**：连接字符串可能包含 `channel_binding=require`，某些版本的 psycopg2 可能不支持。

**解决方案**：代码已更新，会自动移除 `channel_binding=require` 参数。

**验证**：确保连接字符串格式正确：
```
postgresql://user:password@host:port/database?sslmode=require
```

---

#### 4. 检查 Python 依赖

**确认 `requirements.txt` 包含所有依赖**：

```txt
Flask==3.0.3
Flask-Cors==4.0.1
psycopg2-binary==2.9.9
python-dotenv==1.0.1
```

**在 Vercel 构建日志中检查**：
- 是否所有依赖都成功安装
- 是否有版本冲突

---

#### 5. 检查 Vercel 配置

**确认 `vercel.json` 配置正确**：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/index.py"
    }
  ]
}
```

---

#### 6. 测试 API 端点

**直接访问 API 端点**：

1. 访问：`https://你的域名.vercel.app/api/restaurants`
2. 查看返回的错误信息
3. 检查浏览器开发者工具的 Network 标签

**预期响应**：
- ✅ 成功：返回 JSON 数组
- ❌ 失败：返回 500 错误或错误消息

---

#### 7. 常见错误和解决方案

### 错误：`ModuleNotFoundError`

**原因**：Python 模块导入失败

**解决方案**：
- 检查 `api/index.py` 中的路径设置
- 确认所有依赖都在 `requirements.txt` 中

### 错误：`psycopg2.OperationalError`

**原因**：数据库连接失败

**解决方案**：
- 检查 `NEON_DATABASE_URL` 环境变量
- 验证连接字符串格式
- 在 Neon 控制台检查数据库状态

### 错误：`KeyError: 'NEON_DATABASE_URL'`

**原因**：环境变量未设置

**解决方案**：
- 在 Vercel 项目设置中添加环境变量
- 确保在所有环境（Production/Preview/Development）都已设置
- 重新部署项目

---

#### 8. 调试步骤

**步骤 1：添加调试日志**

在 `app.py` 的 `/api/restaurants` 路由中添加：

```python
@app.route("/api/restaurants", methods=["GET", "OPTIONS"])
def get_restaurants():
    try:
        # 添加调试信息
        import os
        print(f"DEBUG: NEON_DATABASE_URL exists: {bool(os.getenv('NEON_DATABASE_URL'))}")
        
        conn = db.get_connection()
        # ... 其余代码
```

**步骤 2：查看 Vercel 日志**

在 Vercel Function Logs 中查看打印的调试信息。

**步骤 3：测试数据库连接**

创建一个测试端点：

```python
@app.route("/api/test-db", methods=["GET"])
def test_db():
    try:
        conn = db.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        result = cur.fetchone()
        conn.close()
        return jsonify({"status": "success", "result": result[0]})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
```

访问 `https://你的域名.vercel.app/api/test-db` 测试连接。

---

#### 9. 重新部署

如果修改了配置或代码：

1. 提交更改到 GitHub
2. 在 Vercel Dashboard 中触发重新部署
3. 或者推送代码到 GitHub，Vercel 会自动部署

---

## 📞 获取更多帮助

如果以上方法都无法解决问题：

1. **查看 Vercel 文档**：https://vercel.com/docs
2. **查看 Neon 文档**：https://neon.tech/docs
3. **检查 Vercel 社区**：https://github.com/vercel/vercel/discussions

---

## ✅ 验证清单

部署前检查：

- [ ] 环境变量 `NEON_DATABASE_URL` 已设置
- [ ] 环境变量在所有环境（Production/Preview/Development）都已设置
- [ ] `requirements.txt` 包含所有依赖
- [ ] `vercel.json` 配置正确
- [ ] `api/index.py` 存在且格式正确
- [ ] 代码已推送到 GitHub
- [ ] Vercel 构建成功（无错误）

部署后检查：

- [ ] 访问 `https://你的域名.vercel.app` 可以看到前端
- [ ] 访问 `https://你的域名.vercel.app/api/restaurants` 返回 JSON 数据
- [ ] Vercel Function Logs 中没有错误

