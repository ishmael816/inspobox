# InspoBox 用户认证配置指南

本文档指导你如何配置 Supabase 以支持用户账号密码认证。

## 1. 应用代码变更概览

改造完成后，项目结构如下：

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── signout/route.ts    # 登出 API
│   ├── login/
│   │   └── page.tsx                 # 登录页面
│   ├── register/
│   │   └── page.tsx                 # 注册页面
│   ├── studio/page.tsx              # 已添加用户菜单
│   └── page.tsx                     # 已添加用户菜单
├── components/
│   └── UserMenu.tsx                 # 用户菜单组件
├── lib/
│   ├── supabase.ts                  # 浏览器端数据操作
│   ├── supabase-client.ts           # 浏览器端客户端
│   ├── supabase-server.ts           # 服务端客户端
│   ├── supabase-middleware.ts       # 中间件会话管理
│   └── database.types.ts            # 数据库类型定义
└── middleware.ts                    # 路由保护中间件
```

## 2. Supabase 控制台配置

### 2.1 启用 Email/Password 认证

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 点击左侧菜单 **Authentication** → **Providers**
4. 找到 **Email** 提供商，启用以下选项：
   - ✅ **Enable Email provider**
   - ✅ **Confirm email**（推荐，需要验证邮箱）
   - ❌ **Secure email change**（可选）
   - ❌ **Secure password change**（可选）
   - ❌ **Magic link**（可选，魔法链接登录）

### 2.2 配置邮箱 SMTP（可选但推荐）

如果需要发送验证邮件，配置 SMTP：

1. 进入 **Authentication** → **SMTP Settings**
2. 配置你的 SMTP 服务器（如 SendGrid、Resend 等）

**开发阶段**：可以暂时关闭 "Confirm email"，这样注册后立即可用。

### 2.3 执行数据库迁移

1. 进入 **SQL Editor**
2. 新建查询
3. 复制 `supabase/migrations/006_add_user_auth.sql` 的内容
4. 执行 SQL

这会：
- 为所有表添加 `user_id` 字段
- 更新 RLS 策略，只允许用户访问自己的数据
- 删除匿名访问策略

## 3. 环境变量配置

确保你的 `.env.local` 包含以下变量：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=你的_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_supabase_anon_key

# AI（保持不变）
DASHSCOPE_API_KEY=你的_dashscope_api_key
```

## 4. 测试流程

### 4.1 注册用户
1. 访问 `/register`
2. 输入邮箱和密码（至少6位）
3. 点击注册
4. 如果启用了邮箱验证，检查邮箱并点击验证链接

### 4.2 登录
1. 访问 `/login`
2. 输入注册的邮箱和密码
3. 登录成功后自动跳转到首页

### 4.3 数据隔离验证
1. 用户 A 创建一些碎片
2. 退出登录，注册/登录用户 B
3. 用户 B 看不到用户 A 的数据

### 4.4 登出
1. 点击右上角用户头像
2. 选择"退出登录"
3. 自动跳转到登录页

## 5. 数据迁移（可选）

如果已有匿名数据需要保留，可以在 Supabase SQL Editor 中执行：

```sql
-- 将现有数据分配给一个特定用户（需要先知道用户ID）
UPDATE fragments SET user_id = '目标用户ID' WHERE user_id IS NULL;
UPDATE stories SET user_id = '目标用户ID' WHERE user_id IS NULL;
UPDATE tags SET user_id = '目标用户ID' WHERE user_id IS NULL;
UPDATE ai_analysis_history SET user_id = '目标用户ID' WHERE user_id IS NULL;
```

## 6. 生产环境注意事项

1. **务必启用邮箱验证** - 防止恶意注册
2. **配置 SMTP** - 确保邮件能正常发送
3. **设置密码策略** - 在 Auth Settings 中配置最小密码长度
4. **启用 CAPTCHA** - 防止机器人攻击（可选）
5. **配置自定义域名** - 邮件中的链接会使用你的域名

## 7. 故障排除

### 登录后仍然显示匿名数据
- 检查 RLS 策略是否正确应用
- 检查数据是否正确设置了 user_id

### 无法注册/登录
- 检查 Supabase Auth 设置中 Email provider 是否启用
- 检查环境变量是否正确配置
- 查看浏览器控制台错误信息

### RLS 权限错误
- 确保已执行 006_add_user_auth.sql
- 检查表中是否有 user_id 字段
- 确认使用的是 authenticated 角色而非 anon

## 8. 扩展功能

### 添加社交登录
在 Supabase Authentication → Providers 中启用：
- Google
- GitHub
- 微信（需要自定义 OAuth）

### 添加密码重置
1. 创建 `/forgot-password` 页面
2. 调用 `supabase.auth.resetPasswordForEmail(email)`
3. 创建 `/reset-password` 页面处理回调

### 用户资料
创建 `profiles` 表存储用户额外信息：
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP
);
```
