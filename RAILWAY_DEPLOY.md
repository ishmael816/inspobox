# Railway 部署指南

## 方式一：CLI 部署（推荐）

### 1. 安装 Railway CLI
```bash
npm install -g @railway/cli
```

### 2. 登录 Railway
```bash
railway login
```
按提示在浏览器完成授权。

### 3. 初始化项目
```bash
railway init
```
- 选择 "Empty Project" 创建新项目
- 或选择现有项目

### 4. 配置环境变量
```bash
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://gegzyyobfgvdnvycsaop.supabase.co
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
railway variables set DASHSCOPE_API_KEY=your_key_here
```

### 5. 部署
```bash
railway up
```

### 6. 获取域名
```bash
railway domain
```

---

## 方式二：GitHub 自动部署

### 1. 推送代码到 GitHub
```bash
git add .
git commit -m "ready for railway deploy"
git push
```

### 2. Railway Dashboard 配置
1. 访问 https://railway.app/new
2. 选择 "Deploy from GitHub repo"
3. 选择你的仓库
4. 点击 "Add Variables" 添加环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DASHSCOPE_API_KEY`
5. 点击 "Deploy"

### 3. 生成域名
部署完成后，在 Dashboard → 你的服务 → Settings → Domains → Generate Domain

---

## 配置 Supabase

部署后，在 Supabase Dashboard → Authentication → URL Configuration：

添加 Railway 给你的域名：
- **Site URL**: `https://你的项目名.up.railway.app`
- **Redirect URLs**: `https://你的项目名.up.railway.app/**`

---

## 绑定自定义域名（可选）

1. Railway Dashboard → 你的服务 → Settings → Domains
2. 点击 "Custom Domain"
3. 输入你的域名：`inspobox.quizcraft.site`
4. 按提示配置 DNS CNAME 记录

---

## 故障排查

### 部署失败
查看日志：
```bash
railway logs
```

### 环境变量未生效
重新设置：
```bash
railway variables
```

### 重新部署
```bash
railway up
```
