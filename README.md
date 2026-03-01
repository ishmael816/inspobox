# InspoBox - 灵感收集器

一个支持多用户的个人小说灵感收集工具。极简主义设计，帮助作家和创意工作者捕捉灵感碎片、管理故事线索，并通过 AI 辅助进行创作重组。

## 功能特性

### 核心功能
- ✨ **灵感捕捉** - 简洁优雅的全屏输入，支持归属故事和标签
- 📚 **故事管理** - 按故事组织灵感碎片，支持颜色标识
- 🏷️ **标签系统** - 多标签分类，灵活筛选
- 🤖 **AI 辅助** - 集成通义千问，智能重组灵感
- 👤 **多用户支持** - 账号密码认证，数据完全隔离
- 🌓 **暗黑模式** - 自适应深色主题
- 📱 **响应式设计** - 支持桌面和移动设备

### 高级功能（新）
- 🔍 **全文搜索** - 搜索内容、故事、标签，实时建议
- 📦 **批量编辑** - 批量移动、添加标签、删除
- 🕸️ **AI 关联探索** - 5 种视图（图谱/分组/时间线/主题/推荐）
- ✨ **智能提示词** - Few-shot 示例、数据校验规则

## 技术栈

- **框架**: Next.js 16 + React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **动画**: Framer Motion
- **AI**: 阿里云 DashScope (通义千问)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI
DASHSCOPE_API_KEY=your_dashscope_api_key
```

### 3. 配置 Supabase 认证

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 进入 **Authentication** → **Providers**
3. 启用 **Email** 提供商
4. 执行数据库迁移（见下方）

详细配置请参考 [AUTH_SETUP.md](./AUTH_SETUP.md)

### 4. 数据库迁移

在 Supabase SQL Editor 中依次执行：

```bash
# 基础表结构
supabase/migrations/001_create_fragments.sql
supabase/migrations/002_add_stories.sql
supabase/migrations/003_add_tags.sql
supabase/migrations/004_add_sort_order.sql
supabase/migrations/005_add_ai_history.sql

# 用户认证改造（关键）
supabase/migrations/006_add_user_auth.sql
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts         # AI 分析 API
│   │   ├── auth/signout/route.ts    # 登出 API
│   │   ├── search/route.ts          # 搜索 API
│   │   ├── relations/               # 关联管理 API
│   │   └── fragments/batch-update   # 批量操作 API
│   ├── login/page.tsx               # 登录页面
│   ├── register/page.tsx            # 注册页面
│   ├── studio/page.tsx              # 创作工作室
│   ├── page.tsx                     # 首页（灵感捕捉）
│   └── layout.tsx
├── components/
│   ├── UserMenu.tsx                 # 用户菜单组件
│   ├── SearchBar.tsx                # 搜索组件
│   ├── BatchActions.tsx             # 批量操作组件
│   └── RelationExplorer.tsx         # 关联探索组件
├── lib/
│   ├── supabase.ts                  # 浏览器端数据操作
│   ├── supabase-client.ts           # 浏览器端客户端
│   ├── supabase-server.ts           # 服务端客户端
│   ├── supabase-middleware.ts       # 中间件会话管理
│   ├── database.types.ts            # 数据库类型定义
│   └── prompts.ts                   # AI 提示词
├── types/index.ts                   # 业务类型定义
└── middleware.ts                    # 路由保护中间件

spec/                                  # SDD 规范文档
├── openapi.yaml                       # OpenAPI 规范
├── database.schema.sql                # 数据库规范
├── architecture.md                    # 架构规范
├── testing.md                         # 测试规范
└── SDD_WORKFLOW.md                    # SDD 工作流

scripts/
└── test-deploy.js                     # 部署测试脚本
```

## 用户认证流程

1. **注册**: 访问 `/register`，使用邮箱密码注册
2. **登录**: 访问 `/login`，登录后自动跳转到首页
3. **数据隔离**: 每个用户只能看到自己的故事、标签和灵感碎片
4. **登出**: 点击右上角头像 → 退出登录

## 路由保护

- **需要登录**: `/`, `/studio`
- **已登录不可访问**: `/login`, `/register`
- **自动跳转**: 未登录用户访问受保护路由会自动重定向到登录页

## 测试与部署

### 快速测试

```bash
# 运行自动化测试
node scripts/test-deploy.js

# 预期输出：✅ 核心测试通过！
```

### 详细测试指南

参考 [DEPLOY_TESTING.md](DEPLOY_TESTING.md) 获取完整的测试 checklist。

### 一键部署

参考 [QUICK_DEPLOY.md](QUICK_DEPLOY.md) 获取 5 分钟部署指南。

### 部署前检查清单

- [ ] 运行测试脚本 `node scripts/test-deploy.js`
- [ ] 执行数据库迁移（见下方）
- [ ] 配置生产环境变量
- [ ] 更新 Supabase URL 配置

### 数据库迁移（必需）

在 Supabase SQL Editor 中执行：

```sql
\i supabase/migrations/007_add_fulltext_search.sql
\i supabase/migrations/008_add_fragment_relations.sql
```

### Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录并部署
vercel login
vercel --prod
```

### 环境变量配置

在 Vercel Dashboard 中设置：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DASHSCOPE_API_KEY`

## 许可证

MIT
