# InspoBox 架构规范

## 1. 系统架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Home Page  │  │  Studio Page │  │  Auth Pages          │  │
│  │   (Capture)  │  │  (Manage)    │  │  (Login/Register)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js App Router                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Middleware (Auth Guard)                                   │  │
│  │  - Protected routes: /, /studio                           │  │
│  │  - Auth routes: /login, /register                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │                           ▼                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │  │
│  │  │ /api/analyze│  │/auth/signout│  │  Server Actions  │  │  │
│  │  │ (AI Route)  │  │             │  │  (Supabase)      │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Supabase Client                         │  │
│  │  - Browser Client (@supabase/ssr)                         │  │
│  │  - Server Client                                          │  │
│  │  - Middleware Client                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Supabase (PostgreSQL + Auth)                  │  │
│  │  - Authentication (Email/Password)                        │  │
│  │  - Database with RLS                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │            阿里云 DashScope (通义千问)                      │  │
│  │            AI Analysis & Streaming                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 2. 技术栈规范

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | Next.js | 16.1.6 | React 全栈框架 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 样式 | Tailwind CSS | 4.x | 原子化 CSS |
| 动画 | Framer Motion | 12.x | 交互动画 |
| 数据库 | Supabase | 2.x | PostgreSQL + Auth |
| AI | DashScope | - | 通义千问 API |
| 拖拽 | @dnd-kit | 6.x | 拖拽排序 |
| 图标 | Lucide React | 0.563 | 图标库 |

## 3. 项目结构规范

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── analyze/
│   │   │   └── route.ts          # AI 分析 API
│   │   └── auth/
│   │       └── signout/
│   │           └── route.ts      # 登出 API
│   ├── login/
│   │   └── page.tsx              # 登录页面
│   ├── register/
│   │   └── page.tsx              # 注册页面
│   ├── studio/
│   │   ├── page.tsx              # 创作工作室
│   │   └── components/           # Studio 专用组件
│   │       ├── AISidebar.tsx
│   │       ├── AIHistoryPanel.tsx
│   │       ├── FragmentCard.tsx
│   │       └── SortableFragmentCard.tsx
│   ├── page.tsx                  # 首页（灵感捕捉）
│   ├── layout.tsx                # 根布局
│   ├── globals.css               # 全局样式
│   └── favicon.ico
├── components/                   # 共享组件
│   └── UserMenu.tsx              # 用户菜单
├── lib/                          # 工具库
│   ├── supabase.ts               # 浏览器端数据操作
│   ├── supabase-client.ts        # 浏览器端客户端
│   ├── supabase-server.ts        # 服务端客户端
│   ├── supabase-middleware.ts    # 中间件会话管理
│   └── database.types.ts         # 数据库类型定义
├── types/                        # 业务类型定义
│   └── index.ts
└── middleware.ts                 # 路由保护中间件
```

## 4. 数据流规范

### 4.1 认证流程

```
User ──▶ /login ──▶ Supabase Auth ──▶ Session Cookie
                                        │
                                        ▼
                    ┌────────────────────────────────────┐
                    │ Middleware Check (every request)   │
                    │ - Validate session                 │
                    │ - Refresh if expired               │
                    │ - Inject user info                 │
                    └────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              Protected          Auth Pages           API Routes
              Routes             (/login)             (Server)
              (/, /studio)       Redirect if          Check JWT
              Redirect if        logged in
              not logged in
```

### 4.2 数据操作流

```
Component ──▶ supabase.ts ──▶ Supabase Client ──▶ PostgreSQL
                (Client)        (@supabase/ssr)      (RLS)
                
Key Principles:
1. 所有数据库操作通过 supabase.ts 中的函数进行
2. 客户端使用 Browser Client
3. 服务端使用 Server Client
4. RLS 策略确保数据隔离
```

## 5. 组件设计规范

### 5.1 组件分类

| 类型 | 位置 | 职责 | 示例 |
|------|------|------|------|
| Page | `app/*/page.tsx` | 页面级组件，处理数据获取 | `Home`, `StudioPage` |
| Feature | `app/*/components/` | 功能组件，业务逻辑 | `AISidebar`, `FragmentCard` |
| Shared | `components/` | 共享组件，复用性高 | `UserMenu` |

### 5.2 组件命名规范

- **Pages**: `*Page` 或直接描述（`Home`, `StudioPage`）
- **Components**: PascalCase，描述功能（`AISidebar`, `FragmentCard`）
- **Hooks**: camelCase，前缀 `use`（`useFragments`, `useAuth`）
- **Types**: PascalCase，后缀类型（`Fragment`, `AIAnalysisResult`）

## 6. API 设计规范

### 6.1 RESTful 原则

| 操作 | HTTP | 路径 | 说明 |
|------|------|------|------|
| 列表 | GET | `/api/resources` | 获取资源列表 |
| 获取 | GET | `/api/resources/:id` | 获取单个资源 |
| 创建 | POST | `/api/resources` | 创建新资源 |
| 更新 | PATCH | `/api/resources/:id` | 部分更新 |
| 删除 | DELETE | `/api/resources/:id` | 删除资源 |

### 6.2 响应格式

```typescript
// 成功响应
interface SuccessResponse<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

// 错误响应
interface ErrorResponse {
  error: string;
  message: string;
  code: string;
  details?: Record<string, string[]>;
}
```

## 7. 安全规范

### 7.1 认证与授权

1. **Session 管理**: 使用 Supabase SSR，Cookie 存储
2. **RLS 策略**: 所有表启用行级安全
3. **CSRF 保护**: 由 Supabase 自动处理
4. **XSS 防护**: React 自动转义，富文本需额外处理

### 7.2 数据验证

```typescript
// 输入验证示例
const CreateFragmentSchema = z.object({
  content: z.string().min(1).max(10000),
  story_id: z.string().uuid().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
});
```

## 8. 性能规范

### 8.1 优化策略

| 策略 | 实现方式 | 适用场景 |
|------|----------|----------|
| 流式响应 | Vercel AI SDK | AI 分析接口 |
| 虚拟列表 | react-window | 大量碎片展示 |
| 图片优化 | next/image | 图片资源 |
| 代码分割 | Dynamic Import | 大型组件 |
| 数据缓存 | React Query | 频繁请求 |

### 8.2 关键指标

- **FCP**: < 1.5s
- **LCP**: < 2.5s
- **TTI**: < 3.5s
- **CLS**: < 0.1

## 9. 开发规范

### 9.1 代码风格

- **ESLint**: 使用 `eslint-config-next`
- **Prettier**: 统一格式化（可选）
- **TypeScript**: 严格模式开启

### 9.2 Git 规范

```
feat: 新功能
fix: 修复
docs: 文档
style: 格式
refactor: 重构
test: 测试
chore: 构建/工具
```

### 9.3 环境变量

```env
# 必需
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DASHSCOPE_API_KEY=

# 可选
NEXT_PUBLIC_APP_URL=
```

## 10. 部署规范

### 10.1 构建配置

```typescript
// next.config.ts
const config = {
  output: 'standalone',  // Docker 部署
  env: {
    customKey: 'value',
  },
};
```

### 10.2 健康检查

```typescript
// app/api/health/route.ts
export async function GET() {
  // 检查数据库连接
  // 检查外部服务
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```
