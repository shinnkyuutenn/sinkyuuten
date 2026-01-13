# 🚀 立即部署到 Vercel

## ✅ 当前状态

- ✅ 数据库已初始化并包含数据
- ✅ 代码已推送到 GitHub
- ✅ Vercel 配置文件已就绪
- ⏳ **只需在 Vercel 中设置环境变量并部署**

---

## 📋 部署步骤（5分钟）

### 步骤 1: 访问 Vercel（1分钟）

1. 打开 https://vercel.com
2. 使用 **GitHub 账号**登录
3. 点击 **"Add New"** → **"Project"**

### 步骤 2: 导入项目（1分钟）

1. 在仓库列表中找到：**`shinnkyuutenn/sinkyuuten`**
2. 点击 **"Import"**

### 步骤 3: 配置项目（1分钟）

保持默认设置，或按以下配置：

- **Framework Preset**: `Other`
- **Root Directory**: `./` (默认)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 步骤 4: 添加环境变量（重要！）（2分钟）

**在部署前，点击 "Environment Variables" 添加：**

| 变量名 | 值 |
|--------|-----|
| `NEON_DATABASE_URL` | `postgresql://neondb_owner:npg_OAtX7RldPb3L@ep-snowy-star-a1ncts7u-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |

**设置选项**：
- ✅ Production
- ✅ Preview  
- ✅ Development

### 步骤 5: 部署（1分钟）

1. 点击 **"Deploy"**
2. 等待构建完成（通常 2-5 分钟）
3. 部署完成后，点击 **"Visit"** 查看你的网站

---

## 🎉 完成！

部署成功后，你的应用将在以下地址运行：
- **URL**: `https://你的项目名.vercel.app`

### 测试 API

- 餐厅列表: `https://你的项目名.vercel.app/api/restaurants`
- 关键词列表: `https://你的项目名.vercel.app/api/keywords`

---

## 🔍 验证部署

### 检查前端
访问你的 Vercel URL，应该能看到应用界面。

### 检查 API
访问 `https://你的项目名.vercel.app/api/restaurants`，应该返回 JSON 数据。

### 检查日志
1. 在 Vercel Dashboard → **Deployments**
2. 选择最新部署
3. 查看 **Function Logs**
4. 确认没有错误

---

## 🐛 常见问题

### 问题：构建失败
- 检查构建日志中的错误信息
- 确保 `package.json` 和 `requirements.txt` 都正确

### 问题：API 返回 500
- 检查 **Function Logs**
- 确认 `NEON_DATABASE_URL` 环境变量已正确设置
- 确认环境变量在所有环境（Production/Preview/Development）都已设置

### 问题：数据库连接失败
- 检查连接字符串是否正确
- 在 Neon 控制台确认数据库状态正常

---

## 📚 相关文档

- 环境变量配置: `VERCEL_ENV.md`
- 详细部署指南: `VERCEL_DEPLOY.md`
- 快速开始: `QUICK_START.md`

---

**准备好了吗？** 现在就去 https://vercel.com 开始部署吧！ 🚀

