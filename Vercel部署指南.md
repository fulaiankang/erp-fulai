# 🚀 Vercel部署指南

## ✨ 为什么选择Vercel？
- ✅ **完全免费** - 无需信用卡，永久免费
- ✅ **极速部署** - 5分钟内完成部署
- ✅ **自动构建** - 连接GitHub后自动部署
- ✅ **全球CDN** - 访问速度快
- ✅ **零配置** - 开箱即用

## 📋 部署步骤

### 步骤1：访问Vercel
1. 打开浏览器，访问 [vercel.com](https://vercel.com)
2. 点击右上角"Sign Up"或"登录"

### 步骤2：登录账号
1. 选择"Continue with GitHub"
2. 授权Vercel访问您的GitHub账号
3. 完成登录

### 步骤3：导入项目
1. 点击"New Project"
2. 在"Import Git Repository"中找到您的`ERP-FULAI`仓库
3. 点击"Import"

### 步骤4：配置项目
1. **Project Name**: `erp-fulai` (或您喜欢的名称)
2. **Framework Preset**: 选择"Other"
3. **Root Directory**: 保持默认 (根目录)
4. **Build Command**: 保持默认
5. **Output Directory**: 保持默认

### 步骤5：环境变量设置
在"Environment Variables"部分添加：
```
NODE_ENV=production
JWT_SECRET=Gp6uzUi3q5+z2voi1ZGHR2PCoyLzu/jI0p9wqmQnjXI=
```

### 步骤6：部署
1. 点击"Deploy"按钮
2. 等待构建完成（约2-3分钟）
3. 部署成功后，Vercel会提供访问URL

## 🔧 部署后配置

### 获取访问URL
- 部署成功后，Vercel会显示类似这样的URL：
- `https://erp-fulai-xxxx.vercel.app`

### 测试系统
1. 访问提供的URL
2. 测试登录功能
3. 测试商品管理功能
4. 测试图片上传功能

## 📱 移动端访问
- Vercel自动提供响应式设计
- 手机、平板都可以正常访问
- 支持PWA（渐进式Web应用）

## 🔄 自动更新
- 每次推送到GitHub主分支
- Vercel会自动重新部署
- 无需手动操作

## 💰 费用说明
- **完全免费** - 无需任何付费
- **无使用限制** - 适合小型ERP系统
- **无信用卡要求** - 注册即可使用

## 🆘 常见问题

### Q: 部署失败怎么办？
A: 检查GitHub仓库是否正确，确保代码没有语法错误

### Q: 图片无法显示？
A: 检查uploads目录是否正确配置，可能需要调整图片存储策略

### Q: 数据库连接问题？
A: Vercel使用无状态部署，SQLite文件会重置，建议后续迁移到云数据库

## 🎯 下一步建议
1. 完成Vercel部署
2. 测试所有功能
3. 如果需要持久化数据，考虑迁移到云数据库（如PlanetScale、Supabase等）

---
**部署完成后，您的ERP系统就可以在全球任何地方访问了！** 🌍
