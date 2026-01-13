# 🔄 强制 Vercel 重新部署指南

## 当前问题
即使 `requirements.txt` 已包含 `requests`，Vercel 仍然报错 `ModuleNotFoundError: No module named 'requests'`。

这可能是因为：
1. Vercel 使用了缓存的旧部署
2. 依赖没有正确安装
3. 需要强制重新部署

## 解决方案

### 方法 1: 在 Vercel Dashboard 中强制重新部署

1. **登录 Vercel Dashboard**
2. **进入项目** → **Deployments**
3. **找到最新的部署**
4. **点击右侧的 "..." 菜单**
5. **选择 "Redeploy"**
6. **确认重新部署**

### 方法 2: 检查构建日志

重新部署后，检查构建日志：

1. **进入 Deployments** → 最新部署
2. **点击 "Build Logs"**
3. **查找以下信息**：
   - `Installing dependencies from requirements.txt`
   - `Successfully installed requests`
   - 或任何错误信息

### 方法 3: 验证 requirements.txt 位置

确认 `requirements.txt` 在项目根目录：
```
sinkyuuten/
├── requirements.txt  ← 应该在这里
├── api/
│   └── index.py
├── app.py
└── ...
```

### 方法 4: 检查 Vercel 项目设置

在 Vercel Dashboard → 项目 → **Settings** → **General**：

确认：
- **Framework Preset**: `Other`
- **Build Command**: `npm run build`（或留空，使用 vercel.json 中的配置）
- **Output Directory**: `dist`
- **Install Command**: 可以留空，Vercel 会自动检测

### 方法 5: 清除缓存并重新部署

如果以上方法都不行：

1. **在 Vercel Dashboard 中**：
   - 进入项目 → **Settings** → **General**
   - 滚动到底部
   - 点击 **"Clear Build Cache"**
   - 然后重新部署

2. **或者推送一个空提交来触发重新部署**：
   ```bash
   git commit --allow-empty -m "Trigger Vercel redeploy"
   git push origin main
   ```

## 验证部署

重新部署后，检查：

1. **构建日志**：确认 `requests` 已安装
2. **函数日志**：确认没有 `ModuleNotFoundError`
3. **测试端点**：访问 `https://sinkyuuten1.vercel.app/api/test-db`

## 如果问题仍然存在

如果重新部署后仍然报错，请：

1. **查看构建日志**，确认 `requests` 是否被安装
2. **查看函数日志**，获取完整的错误信息
3. **检查 `requirements.txt` 格式**，确保没有语法错误

---

**重要提示**：Vercel 的 Python runtime 会自动从项目根目录的 `requirements.txt` 安装依赖。如果文件存在且格式正确，应该会自动安装。

