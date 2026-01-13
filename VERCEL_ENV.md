# 🔐 Vercel 环境变量配置

## 必需的环境变量

在 Vercel 项目设置中添加以下环境变量：

### NEON_DATABASE_URL

**变量名**: `NEON_DATABASE_URL`

**变量值**:
```
postgresql://neondb_owner:npg_OAtX7RldPb3L@ep-snowy-star-a1ncts7u-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**环境**: 选择所有环境（Production, Preview, Development）

---

## 📝 在 Vercel 中设置环境变量的步骤

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 点击 **Add New**
5. 输入：
   - **Key**: `NEON_DATABASE_URL`
   - **Value**: 上面的连接字符串
   - **Environment**: 勾选所有（Production, Preview, Development）
6. 点击 **Save**

---

## ⚠️ 安全提示

- ✅ 环境变量在 Vercel 中是加密存储的
- ✅ 只有项目成员可以查看环境变量
- ❌ **不要**在代码中硬编码连接字符串
- ❌ **不要**将 `.env` 文件提交到 Git

---

## 🔄 更新环境变量

如果需要更新数据库连接字符串：

1. 在 Vercel Dashboard 中编辑环境变量
2. 保存后，Vercel 会自动重新部署
3. 或者手动触发重新部署

---

## ✅ 验证环境变量

部署后，可以在 Vercel Function Logs 中检查：

1. 进入项目 → **Deployments**
2. 选择最新部署
3. 查看 **Function Logs**
4. 如果看到数据库连接错误，检查环境变量是否正确设置

