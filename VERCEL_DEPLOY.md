# Vercel 部署指南 - Neon 数据库同步

本指南将帮助您将项目部署到 Vercel，并配置 Neon 数据库同步。

## 📋 前置要求

1. **GitHub 账户** - 项目需要推送到 GitHub
2. **Vercel 账户** - 注册 [vercel.com](https://vercel.com)
3. **Neon 账户** - 注册 [neon.tech](https://neon.tech) 并创建数据库

## 🚀 部署步骤

### 第一步：准备 GitHub 仓库

1. 确保所有代码已提交到 GitHub：
```bash
git add .
git commit -m "准备 Vercel 部署"
git push origin main
```

### 第二步：在 Neon 创建数据库

1. 访问 [Neon Console](https://console.neon.tech)
2. 创建新项目（如果还没有）
3. 创建数据库
4. **重要**：复制连接字符串，格式类似：
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### 第三步：初始化 Neon 数据库

在本地执行以下步骤来初始化数据库：

1. **设置环境变量**（临时）：
```bash
export NEON_DATABASE_URL="你的Neon连接字符串"
```

2. **执行数据库 Schema**：
```bash
# 使用 psql 连接并执行 schema
psql "你的Neon连接字符串" -f src/india_reviews_schema.sql

# 或者使用 Python 脚本
python3 -c "
from db import get_connection
import psycopg2

conn = get_connection()
cur = conn.cursor()

# 读取并执行 schema 文件
with open('src/india_reviews_schema.sql', 'r', encoding='utf-8') as f:
    cur.execute(f.read())

conn.commit()
conn.close()
print('数据库 Schema 初始化完成')
"
```

3. **（可选）导入测试数据**：
```bash
psql "你的Neon连接字符串" -f src/test_restaurants_data.sql
```

4. **（可选）创建管理员账户**：
```bash
python3 create_admin.py
```

### 第四步：在 Vercel 部署

1. **登录 Vercel**：
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账户登录

2. **导入项目**：
   - 点击 "Add New" → "Project"
   - 选择你的 GitHub 仓库
   - Vercel 会自动检测配置

3. **配置环境变量**：
   在 Vercel 项目设置中添加以下环境变量：
   
   **必需的环境变量**：
   - `NEON_DATABASE_URL`: 你的 Neon 数据库连接字符串
     ```
     postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
     ```
   
   **可选的环境变量**：
   - `FLASK_DEBUG`: `false` (生产环境)
   - `FLASK_SECRET_KEY`: 用于 session 加密的密钥（随机字符串）

4. **配置构建设置**：
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   
   **注意**：Python 依赖（requirements.txt）会在部署时自动安装，无需在 Install Command 中指定。

5. **部署**：
   - 点击 "Deploy"
   - 等待构建完成

## 🔄 数据库同步说明

### Neon 数据库的特点

Neon 是一个**托管 PostgreSQL 数据库服务**，具有以下特点：

1. **自动同步**：数据存储在 Neon 的云服务器上，所有连接到同一数据库的客户端都会看到相同的数据
2. **无需手动同步**：只要所有环境（本地开发、Vercel 生产环境）使用相同的 `NEON_DATABASE_URL`，数据就会自动同步
3. **实时更新**：任何环境的数据更改都会立即反映到所有其他环境

### 数据同步流程

```
本地开发环境 ──┐
              ├──→ Neon 数据库 ←── Vercel 生产环境
其他环境 ──────┘
```

**重要**：
- ✅ 所有环境使用**相同的** `NEON_DATABASE_URL`
- ✅ 数据更改会立即在所有环境可见
- ❌ 不需要手动同步或数据迁移脚本

### 数据库迁移

如果需要修改数据库结构（添加表、列等）：

1. **在本地开发**：
   - 修改数据库结构
   - 测试更改

2. **应用到 Neon**：
   ```bash
   # 方法1：使用 psql
   psql "你的NEON_DATABASE_URL" -f migration.sql
   
   # 方法2：使用 Python 脚本
   python3 your_migration_script.py
   ```

3. **自动生效**：
   - Vercel 上的应用会自动使用新的数据库结构
   - 无需重新部署（除非代码也需要更改）

## 📝 环境变量配置清单

在 Vercel 项目设置 → Environment Variables 中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NEON_DATABASE_URL` | `postgresql://...` | Neon 数据库连接字符串（必需） |
| `FLASK_SECRET_KEY` | 随机字符串 | Session 加密密钥（推荐） |
| `FLASK_DEBUG` | `false` | 生产环境设为 false |

## 🔍 验证部署

部署完成后，访问你的 Vercel URL，检查：

1. **前端是否正常加载**
2. **API 是否正常响应**：
   - `https://你的域名.vercel.app/api/restaurants`
   - `https://你的域名.vercel.app/api/keywords`
3. **数据库连接是否正常**：检查 Vercel 函数日志

### 检查部署日志

在 Vercel Dashboard 中：
1. 进入你的项目
2. 点击 "Deployments" 标签
3. 选择最新的部署
4. 查看 "Function Logs" 检查是否有错误

### 测试数据库连接

如果 API 返回 500 错误，可能是数据库连接问题：
1. 检查 `NEON_DATABASE_URL` 环境变量是否正确设置
2. 确保连接字符串包含 `?sslmode=require`
3. 在 Neon 控制台检查数据库是否正常运行

## 🐛 常见问题

### 问题1：数据库连接失败

**解决方案**：
- 检查 `NEON_DATABASE_URL` 是否正确设置
- 确保连接字符串包含 `?sslmode=require`
- 检查 Neon 控制台中的数据库是否正常运行

### 问题2：静态文件404

**解决方案**：
- 确保 `npm run build` 成功生成 `dist` 目录
- 检查 `vercel.json` 中的路由配置

### 问题3：CORS 错误

**解决方案**：
- 检查 `app.py` 中的 CORS 配置
- 确保 Vercel 域名在允许的源列表中（当前配置允许所有源）

### 问题4：数据库 Schema 未初始化

**解决方案**：
- 按照"第三步：初始化 Neon 数据库"执行
- 检查 `src/india_reviews_schema.sql` 是否正确执行

## 📚 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [Neon 文档](https://neon.tech/docs)
- [Flask 部署指南](https://flask.palletsprojects.com/en/latest/deploying/)

## 🔐 安全建议

1. **永远不要**将 `.env` 文件提交到 Git
2. **使用** Vercel 的环境变量功能存储敏感信息
3. **定期更新**依赖包以修复安全漏洞
4. **使用强密码**和随机生成的 `FLASK_SECRET_KEY`

---

**提示**：首次部署后，建议在 Vercel 的 Function Logs 中检查是否有错误信息。

