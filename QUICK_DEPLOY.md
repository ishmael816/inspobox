# InspoBox 一键部署指南

> 快速部署 checklist，5 分钟上线

## 🚀 部署前准备

### 1. 运行自动测试

```bash
# 运行测试脚本
node scripts/test-deploy.js

# 预期输出：✅ 核心测试通过！
```

### 2. 确保已配置环境变量

`.env.local` 文件必须包含：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
DASHSCOPE_API_KEY=sk-...
```

### 3. 执行数据库迁移

登录 https://app.supabase.com → SQL Editor

执行以下 SQL 文件：

```sql
-- 文件 1: supabase/migrations/007_add_fulltext_search.sql
-- 文件 2: supabase/migrations/008_add_fragment_relations.sql
```

---

## 🎯 方式一：Vercel 部署（推荐）

### 步骤 1: 安装 Vercel CLI

```bash
npm i -g vercel
```

### 步骤 2: 登录并部署

```bash
# 登录（浏览器授权）
vercel login

# 部署到预览环境（测试）
vercel

# 确认无误后，部署到生产环境
vercel --prod
```

### 步骤 3: 配置环境变量

Vercel Dashboard → Project Settings → Environment Variables

添加：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DASHSCOPE_API_KEY`

### 步骤 4: 配置 Supabase

登录 https://app.supabase.com → Authentication → URL Configuration

- **Site URL**: `https://your-project.vercel.app`
- **Redirect URLs**: `https://your-project.vercel.app/**`

---

## 🚂 方式二：Railway 部署

### 步骤 1: 安装 Railway CLI

```bash
npm i -g @railway/cli
```

### 步骤 2: 部署

```bash
# 登录
railway login

# 部署
railway up

# 生成域名
railway domain
```

### 步骤 3: 配置环境变量

```bash
railway variables set NEXT_PUBLIC_SUPABASE_URL="..."
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
railway variables set DASHSCOPE_API_KEY="..."
```

---

## ✅ 部署后验证

### 自动验证脚本

```bash
# 测试生产环境（替换为你的域名）
node scripts/test-deploy.js https://your-domain.com
```

### 手动验证清单

访问你的域名，检查：

- [ ] 首页可以访问
- [ ] 注册新账号成功
- [ ] 创建灵感碎片成功
- [ ] 搜索功能正常
- [ ] 批量编辑功能正常
- [ ] AI 关联探索功能正常

---

## 🐛 常见问题

### 问题 1: 构建失败

```bash
# 清除缓存重新构建
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### 问题 2: API 返回 500

检查 Vercel/Railway Functions 日志，确认：
- 环境变量已正确设置
- Supabase 连接正常

### 问题 3: 数据库错误

在 Supabase SQL Editor 执行：

```sql
-- 检查表是否存在
SELECT * FROM information_schema.tables 
WHERE table_name = 'fragment_relations';

-- 如果缺失，重新执行迁移
```

---

## 📊 部署状态检查

```bash
# 完整测试流程
node scripts/test-deploy.js        # 本地测试
npm run build                       # 构建测试
vercel --prod                       # 部署
node scripts/test-deploy.js https://...  # 生产验证
```

---

## 🎉 部署成功！

你的 InspoBox 应用现在应该可以正常访问了。

**功能清单**:
- ✅ 用户认证
- ✅ 灵感捕捉
- ✅ 故事管理
- ✅ 标签系统
- ✅ 搜索功能
- ✅ 批量编辑
- ✅ AI 关联探索

---

**最后更新**: 2026-03-01
