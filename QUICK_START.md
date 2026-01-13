# 🚀 快速部署指南

## 5 分钟快速部署到 Vercel + Neon

### 步骤 1: 准备 Neon 数据库（2分钟）

1. 访问 [neon.tech](https://neon.tech) 并登录
2. 创建新项目 → 创建数据库
3. 复制连接字符串（格式：`postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`）

### 步骤 2: 初始化数据库（1分钟）

在本地终端执行：

```bash
# 设置环境变量
export NEON_DATABASE_URL="你的连接字符串"

# 初始化数据库
python3 init_neon_db.py
```

### 步骤 3: 推送到 GitHub（1分钟）

```bash
git add .
git commit -m "准备 Vercel 部署"
git push origin main
```

### 步骤 4: 部署到 Vercel（1分钟）

1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 "Add New" → "Project"
3. 选择你的 GitHub 仓库
4. **添加环境变量**：
   - 名称：`NEON_DATABASE_URL`
   - 值：你的 Neon 连接字符串
5. 点击 "Deploy"

### ✅ 完成！

部署完成后，你的应用将在 `https://你的项目名.vercel.app` 运行。

---

## 🔄 数据库同步说明

**重要**：Neon 是云数据库，数据自动同步！

- ✅ 所有环境（本地、Vercel）使用**相同的** `NEON_DATABASE_URL`
- ✅ 数据更改会**立即**在所有环境可见
- ❌ **不需要**手动同步或迁移脚本

### 数据流向

```
本地开发 → Neon 数据库 ← Vercel 生产
         (自动同步)
```

---

## 📝 常用命令

### 初始化数据库
```bash
export NEON_DATABASE_URL="你的连接字符串"
python3 init_neon_db.py
```

### 创建管理员账户
```bash
export NEON_DATABASE_URL="你的连接字符串"
python3 create_admin.py
```

### 本地开发
```bash
# 设置环境变量
export NEON_DATABASE_URL="你的连接字符串"

# 启动 Flask
python3 app.py

# 启动前端（另一个终端）
npm run dev
```

---

## 🐛 遇到问题？

查看详细文档：[VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

