# Vercel 部署指南

## 方式一：Vercel CLI 部署（推荐）

### 1. 安装 Vercel CLI
```bash
npm i -g vercel
```

### 2. 登录 Vercel
```bash
vercel login
```

### 3. 部署项目
```bash
# 在项目根目录执行
vercel

# 或指定环境
vercel --prod
```

## 方式二：Git 集成部署（自动）

### 1. 推送代码到 GitHub
```bash
git add .
git commit -m "准备部署"
git push
```

### 2. Vercel Dashboard 配置
1. 访问 https://vercel.com/new
2. 导入 GitHub 仓库
3. 配置环境变量（见下方）
4. 点击 Deploy

## 环境变量配置

在 Vercel Dashboard → Project Settings → Environment Variables 中添加：

```
NEXT_PUBLIC_SUPABASE_URL=https://gegzyyobfgvdnvycsaop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DASHSCOPE_API_KEY=your_dashscope_api_key
```

⚠️ **重要**：
- `NEXT_PUBLIC_` 前缀的变量会被暴露到浏览器端
- `DASHSCOPE_API_KEY` 只需服务端使用，不需要 `NEXT_PUBLIC_` 前缀

## Supabase 配置（重要）

### 1. 更新 Supabase 允许域名
在 Supabase Dashboard → Authentication → URL Configuration：

**Site URL**: 
```
https://your-project.vercel.app
```

**Redirect URLs**: 
```
https://your-project.vercel.app/**
```

### 2. 确保 RLS 策略正确
执行过 `006_add_user_auth.sql` 迁移，确保数据隔离。

## 部署后检查清单

- [ ] 首页能正常访问
- [ ] 注册/登录功能正常
- [ ] 创建灵感碎片成功
- [ ] 数据在刷新后依然存在
- [ ] 不同用户数据隔离正常
- [ ] AI 分析功能正常（如果配置了 DASHSCOPE_API_KEY）

## 故障排查

### 500 错误
查看 Vercel Dashboard → Logs，检查：
- 环境变量是否正确设置
- Supabase 连接是否正常

### 登录后跳转错误
检查 Supabase Auth 的 Redirect URL 配置是否包含 Vercel 域名。

### CORS 错误
确保 Supabase 的 API Settings 中允许了 Vercel 域名。

## 绑定自定义域名（可选）

1. Vercel Dashboard → Domains
2. 添加你的域名
3. 按提示配置 DNS
