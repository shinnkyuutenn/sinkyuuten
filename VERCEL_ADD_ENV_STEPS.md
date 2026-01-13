# 📝 在 Vercel 中添加环境变量 - 详细步骤

## 方法一：在导入项目时添加（推荐）

### 步骤 1: 导入项目
1. 访问 https://vercel.com 并登录
2. 点击 **"Add New"** → **"Project"**
3. 选择仓库：`shinnkyuutenn/sinkyuuten`
4. 点击 **"Import"**

### 步骤 2: 在配置页面添加环境变量
在项目配置页面，你会看到：

1. **找到 "Environment Variables" 部分**
   - 通常在配置页面的下方
   - 或者在 "Build and Output Settings" 附近

2. **点击 "Environment Variables" 或 "+ Add" 按钮**

3. **添加环境变量**：
   - **Key（变量名）**: 输入 `NEON_DATABASE_URL`
   - **Value（变量值）**: 粘贴以下内容：
     ```
     postgresql://neondb_owner:npg_OAtX7RldPb3L@ep-snowy-star-a1ncts7u-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
     ```
   - **Environment（环境）**: 勾选所有三个选项：
     - ✅ Production
     - ✅ Preview
     - ✅ Development

4. **点击 "Add" 或 "Save"**

5. **点击 "Deploy"** 开始部署

---

## 方法二：在项目设置中添加（如果已导入项目）

### 步骤 1: 进入项目设置
1. 访问 https://vercel.com/dashboard
2. 找到你的项目 `sinkyuuten`
3. 点击项目名称进入项目页面

### 步骤 2: 进入环境变量设置
1. 点击顶部菜单的 **"Settings"**（设置）
2. 在左侧菜单中找到 **"Environment Variables"**（环境变量）
3. 点击进入

### 步骤 3: 添加环境变量
1. 点击 **"Add New"** 或 **"Add"** 按钮

2. **填写信息**：
   - **Key**: `NEON_DATABASE_URL`
   - **Value**: 
     ```
     postgresql://neondb_owner:npg_OAtX7RldPb3L@ep-snowy-star-a1ncts7u-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
     ```
   - **Environment**: 选择所有环境
     - ✅ Production
     - ✅ Preview
     - ✅ Development

3. 点击 **"Save"**

### 步骤 4: 重新部署（如果需要）
如果项目已经部署过：
1. 进入 **"Deployments"** 标签
2. 找到最新的部署
3. 点击右侧的 **"..."** 菜单
4. 选择 **"Redeploy"**
5. 确认重新部署

---

## 📸 界面说明

### 环境变量添加界面通常显示为：

```
┌─────────────────────────────────────┐
│ Environment Variables               │
├─────────────────────────────────────┤
│ Key: [NEON_DATABASE_URL        ]    │
│ Value: [postgresql://...        ]   │
│                                     │
│ Environment:                        │
│ ☑ Production                       │
│ ☑ Preview                          │
│ ☑ Development                      │
│                                     │
│ [Cancel]  [Add/Save]               │
└─────────────────────────────────────┘
```

---

## ✅ 验证环境变量已添加

添加后，你应该能在环境变量列表中看到：

| Key | Value (隐藏) | Environments |
|-----|--------------|--------------|
| `NEON_DATABASE_URL` | `••••••••` | Production, Preview, Development |

---

## ⚠️ 重要提示

1. **复制完整连接字符串**：确保复制时包含所有内容，特别是 `?sslmode=require&channel_binding=require` 部分

2. **选择所有环境**：建议在 Production、Preview、Development 三个环境都添加，这样在任何环境下都能正常工作

3. **值不会显示**：出于安全考虑，Vercel 会隐藏环境变量的值，只显示 `••••`，这是正常的

4. **立即生效**：添加环境变量后，下次部署时会自动使用新的环境变量

---

## 🐛 如果找不到环境变量设置

### 在导入项目时：
- 向下滚动配置页面
- 查找 "Environment Variables" 或 "Environment" 部分
- 可能在 "Build and Output Settings" 下方

### 在项目设置中：
- 确保你已进入项目页面（不是 Dashboard）
- 点击顶部的 **"Settings"** 标签
- 在左侧菜单中查找 **"Environment Variables"**

---

## 📞 需要帮助？

如果遇到问题：
1. 检查是否已登录 Vercel
2. 确认有项目访问权限
3. 查看 Vercel 文档：https://vercel.com/docs/environment-variables

---

**完成这些步骤后，你的应用就可以连接到 Neon 数据库了！** 🎉

