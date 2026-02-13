# InspoBox 项目改造总结

## 日期
2026-02-13

## 概述
今天完成了 InspoBox 项目的用户认证系统全面改造，支持多用户账号密码登录，数据完全隔离。同时尝试了多种部署方案（Vercel、Railway）。

---

## 一、用户认证系统改造

### 1. 数据库层改造

**文件**: `supabase/migrations/006_add_user_auth.sql`

- 为所有表添加 `user_id` 字段（stories、tags、fragments、ai_analysis_history）
- 更新 RLS 策略，从匿名访问改为认证用户访问
- 用户只能访问自己的数据

```sql
-- 示例：stories 表 RLS 策略
CREATE POLICY "Users can only access their own stories" ON stories
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### 2. 前端认证页面

**登录页面**: `src/app/login/page.tsx`
- 邮箱密码登录表单
- 支持重定向回原页面
- 错误处理和加载状态
- Suspense 边界处理

**注册页面**: `src/app/register/page.tsx`
- 用户注册表单
- 密码确认验证
- 注册成功提示

**用户菜单**: `src/components/UserMenu.tsx`
- 显示当前用户邮箱首字母
- 下拉菜单显示用户信息
- 退出登录功能

### 3. Supabase 客户端改造

**浏览器端**: `src/lib/supabase-client.ts`
- 使用 `@supabase/ssr` 的 `createBrowserClient`
- 环境变量检查

**服务端**: `src/lib/supabase-server.ts`
- 用于 Server Components 和 API Routes
- 支持 cookie 管理

**中间件**: `src/lib/supabase-middleware.ts`
- 会话刷新和验证
- 错误降级处理

**数据操作**: `src/lib/supabase.ts`
- 所有函数添加用户 ID 自动注入
- `createFragment`、`createStory`、`createTag` 等

### 4. 路由保护

**中间件**: `src/middleware.ts`
- 保护路由：`/`、`/studio`（需登录）
- 阻止已登录用户访问：`/login`、`/register`
- 自动重定向到登录页

### 5. 页面集成

**首页**: `src/app/page.tsx`
- 添加 UserMenu 组件到右上角
- 未登录用户自动重定向

**Studio 页**: `src/app/studio/page.tsx`
- 添加 UserMenu 组件
- 数据自动按用户过滤

---

## 二、API 接口

**登出 API**: `src/app/api/auth/signout/route.ts`
- POST 接口处理用户登出
- 清除 Supabase 会话

**调试 API**: `src/app/api/debug/route.ts`
- 检查环境变量是否正确加载

---

## 三、配置和文档

### 环境变量
```bash
NEXT_PUBLIC_SUPABASE_URL=https://gegzyyobfgvdnvycsaop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
DASHSCOPE_API_KEY=your_dashscope_api_key  # AI功能
```

### 创建的文档
- `AUTH_SETUP.md` - 用户认证配置指南
- `DEPLOY.md` - Vercel 部署指南
- `DEPLOY_DOMAIN.md` - 腾讯云域名配置指南
- `RAILWAY_DEPLOY.md` - Railway 部署指南
- `CDN_SETUP.md` - 腾讯云 CDN 配置指南

### 配置文件
- `vercel.json` - Vercel 区域配置（香港）
- `railway.json` - Railway 部署配置
- `nixpacks.toml` - Railway Node 版本配置
- `.vercelignore` - Vercel 忽略文件

---

## 四、Bug 修复

### 1. 注释格式错误
**问题**: JSX 注释闭合符写成了 `-->` 而不是 `*/`
**修复文件**:
- `src/app/page.tsx`: `{/* 成功提示 */}`
- `src/app/studio/page.tsx`: `{/* 故事 Tab 页签 */}`

### 2. 类型错误
**问题**: `router.push(redirect)` 类型不匹配
**修复**: 添加类型断言 `router.push(redirect as any)`

### 3. Suspense 边界
**问题**: `useSearchParams` 需要在 Suspense 中使用
**修复**: 将 LoginForm 抽取为单独组件，外层包裹 Suspense

### 4. 数据库类型问题
**问题**: 类型定义导致 insert 报错
**修复**: 移除 `supabase-client.ts` 中的泛型类型 `<Database>`

---

## 五、数据清理

**文件**: `supabase/seed_stories.sql`、 `supabase/seed.sql`

- 注释掉了默认故事数据（时间循环之谜、都市传说集、雨夜书店）
- 新用户注册后不再自动创建这些故事

---

## 六、部署教程

### 方式一：Vercel CLI 部署

#### 1. 安装 Vercel CLI
```bash
npm i -g vercel
```

#### 2. 登录 Vercel
```bash
vercel login
# 按提示在浏览器完成授权
```

#### 3. 部署项目
```bash
# 在项目根目录执行
vercel --prod
```

#### 4. 配置环境变量
在 Vercel Dashboard → Project Settings → Environment Variables 中添加：
```
NEXT_PUBLIC_SUPABASE_URL=https://gegzyyobfgvdnvycsaop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DASHSCOPE_API_KEY=your_dashscope_api_key
```

#### 5. 配置 Supabase
访问 https://app.supabase.com → 你的项目 → Authentication → URL Configuration：
- **Site URL**: `https://你的项目名.vercel.app`
- **Redirect URLs**: `https://你的项目名.vercel.app/**`

#### 6. 绑定自定义域名（可选）
```bash
vercel domains add yourdomain.com
```
然后在 DNS 提供商添加 CNAME 记录指向 `cname.vercel-dns.com`

---

### 方式二：Railway CLI 部署

#### 1. 安装 Railway CLI
```bash
npm install -g @railway/cli
```

#### 2. 登录 Railway
```bash
railway login
# 按提示在浏览器完成授权
```

#### 3. 初始化项目
```bash
# 进入项目目录
cd D:\Projects\inspobox

# 初始化 Railway 项目
railway init
# 选择 "Create a new project" 创建新项目
```

#### 4. 设置环境变量
```bash
railway variables set NEXT_PUBLIC_SUPABASE_URL="https://gegzyyobfgvdnvycsaop.supabase.co"
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
railway variables set DASHSCOPE_API_KEY="your_api_key"
```

#### 5. 部署
```bash
railway up
```

#### 6. 获取域名
```bash
railway domain
```

#### 7. 配置 Supabase
访问 https://app.supabase.com → 你的项目 → Authentication → URL Configuration：
- **Site URL**: `https://你的项目名.up.railway.app`
- **Redirect URLs**: `https://你的项目名.up.railway.app/**`

---

### 方式三：Railway Dashboard 部署（推荐）

#### 1. 推送代码到 GitHub
```bash
git add .
git commit -m "ready for deploy"
git push
```

#### 2. Railway Dashboard 配置
1. 访问 https://railway.app/new
2. 点击 **Deploy from GitHub repo**
3. 选择你的仓库 `ishmael816/inspobox`
4. 点击 **Add Variables** 添加环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DASHSCOPE_API_KEY`（可选）
5. 点击 **Deploy**

#### 3. 生成域名
部署完成后，在 Dashboard → 你的服务 → Settings → Domains → Generate Domain

#### 4. 绑定自定义域名（可选）
1. Railway Dashboard → 你的服务 → Settings → Domains
2. 点击 **Custom Domain**
3. 输入你的域名：`inspobox.quizcraft.site`
4. 按提示配置 DNS CNAME 记录

---

## 七、部署问题记录

### Vercel 部署
- **成功**: 部署到 `inspobox-nu.vercel.app`
- **配置**: 香港区域 (`hkg1`)、腾讯云域名
- **问题**: 香港地区访问 Vercel 超时 (ERR_CONNECTION_TIMED_OUT)

### Railway 部署
- **创建**: 项目 `outstanding-courage`
- **问题**: Node.js 版本过低（Railway 默认 v18，项目需要 v20）
- **解决尝试**: 添加 `nixpacks.toml` 指定 Node 20
- **状态**: 等待部署完成

---

## 八、文件变更清单

### 新增文件
```
src/app/login/page.tsx
src/app/register/page.tsx
src/app/api/auth/signout/route.ts
src/app/api/debug/route.ts
src/components/UserMenu.tsx
src/lib/supabase-client.ts
src/lib/supabase-server.ts
src/lib/supabase-middleware.ts
src/lib/database.types.ts
src/middleware.ts
supabase/migrations/006_add_user_auth.sql
vercel.json
railway.json
nixpacks.toml
.vercelignore
AUTH_SETUP.md
DEPLOY.md
DEPLOY_DOMAIN.md
RAILWAY_DEPLOY.md
CDN_SETUP.md
TODAY_WORK_SUMMARY.md
```

### 修改文件
```
next.config.ts
package.json
src/lib/supabase.ts
src/app/page.tsx
src/app/studio/page.tsx
src/app/layout.tsx
supabase/seed_stories.sql
supabase/seed.sql
README.md
```

---

## 九、访问地址

### Vercel 部署
- 主链接: https://inspobox-nu.vercel.app
- 最新部署: https://inspobox-7wrdcit9b-ishmael816s-projects.vercel.app

### 腾讯云域名
- 已配置: `inspobox.quizcraft.site` （DNS 已指向 Vercel）

### Railway 项目
- 项目名: `outstanding-courage`
- 项目 ID: `bea4d898-c042-4928-8291-1edcb3889fed`

---

## 十、Supabase 配置状态

### 已配置
- ✅ 数据库表结构（含 user_id）
- ✅ RLS 策略更新
- ✅ Email Provider 启用（Auth Settings）
- ✅ 环境变量设置

### 待配置
- ⏳ URL Configuration（添加 Railway 域名）
- ⏳ 邮箱验证设置（生产环境建议启用）

---

## 总结

今天完成了用户认证系统的全面改造，包括数据库、前端页面、API 和部署配置。由于香港地区网络问题，Vercel 访问不稳定，Railway 部署因 Node 版本问题未完成。建议使用腾讯云服务器部署以获得最佳体验。
