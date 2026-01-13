# ✅ 部署检查清单

## 当前状态
- ✅ 代码已推送到 GitHub
- ✅ Vercel 配置文件已创建
- ⏳ 等待完成以下步骤

## 📋 部署步骤

### 步骤 1: 创建 Neon 数据库（如果还没有）

1. 访问 https://console.neon.tech
2. 登录（使用 GitHub 或 Google 账号）
3. 创建新项目（如果还没有）
4. 创建数据库
5. **复制连接字符串**（格式类似：`postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`）

### 步骤 2: 初始化 Neon 数据库

在终端执行：

```bash
# 设置环境变量（替换为你的实际连接字符串）
export NEON_DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"

# 初始化数据库
python3 init_neon_db.py
```

**预期输出**：
- ✅ 数据库连接成功
- ✅ Schema 执行完成
- ✅ 表创建成功

### 步骤 3: 在 Vercel 部署

1. **访问 Vercel**：
   - 打开 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**：
   - 点击 "Add New" → "Project"
   - 选择仓库：`shinnkyuutenn/sinkyuuten`
   - 点击 "Import"

3. **配置项目**：
   - Framework Preset: **Other**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **添加环境变量**（重要！）：
   - 点击 "Environment Variables"
   - 添加以下变量：
     - **Name**: `NEON_DATABASE_URL`
     - **Value**: 你的 Neon 连接字符串（与步骤 2 中使用的相同）
     - **Environment**: Production, Preview, Development（全部勾选）

5. **部署**：
   - 点击 "Deploy"
   - 等待构建完成（通常 2-5 分钟）

### 步骤 4: 验证部署

部署完成后：

1. **访问你的网站**：
   - URL: `https://你的项目名.vercel.app`

2. **测试 API**：
   - `https://你的项目名.vercel.app/api/restaurants`
   - `https://你的项目名.vercel.app/api/keywords`

3. **检查日志**：
   - 在 Vercel Dashboard → Deployments → 选择最新部署
   - 查看 "Function Logs" 确认没有错误

## 🎉 完成！

如果所有步骤都成功，你的应用现在应该：
- ✅ 在 Vercel 上运行
- ✅ 连接到 Neon 数据库
- ✅ 数据自动同步

## 🐛 遇到问题？

### 问题：数据库连接失败
- 检查 `NEON_DATABASE_URL` 是否正确设置
- 确保连接字符串包含 `?sslmode=require`
- 在 Neon 控制台检查数据库状态

### 问题：构建失败
- 检查 Vercel 构建日志
- 确保 `package.json` 中的依赖都正确
- 检查 `requirements.txt` 中的 Python 依赖

### 问题：API 返回 500 错误
- 查看 Vercel Function Logs
- 检查数据库连接字符串
- 确认数据库已正确初始化

---

**需要帮助？** 查看详细文档：
- 快速指南：`QUICK_START.md`
- 详细文档：`VERCEL_DEPLOY.md`

