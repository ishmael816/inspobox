# InspoBox 规范-代码映射图

本文档展示 SDD 规范如何映射到实际代码实现。

## 整体映射关系

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SPEC LAYER                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ openapi.yaml │  │database.sch..│  │architecture..│  │  testing.md  │    │
│  │   (API 规范)  │  │  (数据规范)   │  │  (架构规范)   │  │  (测试规范)   │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
└─────────┼─────────────────┼─────────────────┼─────────────────┼────────────┘
          │                 │                 │                 │
          │ GENERATE        │ GENERATE        │ REFERENCE       │ REFERENCE
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CODE LAYER                                       │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         src/types/                                   │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │   │
│  │  │  index.ts       │  │ database.types.ts│  │   api.types.ts      │ │   │
│  │  │ (Business Types)│  │ (Database Types) │  │  (Generated)        │ │   │
│  │  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘ │   │
│  └───────────┼────────────────────┼──────────────────────┼────────────┘   │
│              │                    │                      │                │
│  ┌───────────▼────────────────────▼──────────────────────▼────────────┐   │
│  │                         src/lib/                                    │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │   │
│  │  │  supabase.ts    │  │ supabase-*.ts   │  │   (api-client)      │  │   │
│  │  │ (Data Operations)│  │ (Clients)       │  │  (Generated)        │  │   │
│  │  └────────┬────────┘  └─────────────────┘  └─────────────────────┘  │   │
│  └───────────┼─────────────────────────────────────────────────────────┘   │
│              │                                                              │
│  ┌───────────▼─────────────────────────────────────────────────────────┐   │
│  │                      src/app/api/                                    │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │   │
│  │  │ analyze/route.ts│  │ auth/signout/   │  │  (other routes)     │  │   │
│  │  │   (AI API)      │  │   route.ts      │  │                     │  │   │
│  │  │                 │  │  (Auth API)     │  │                     │  │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      src/app/*/page.tsx                              │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │   │
│  │  │    page.tsx     │  │ studio/page.tsx │  │  login/page.tsx     │  │   │
│  │  │   (Home/Capture) │  │   (Studio)      │  │  (Auth Pages)       │  │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## 详细映射

### 1. API 规范 → 代码实现

| OpenAPI Path | HTTP | 实现文件 | 函数名 |
|--------------|------|----------|--------|
| `/api/analyze` | POST | `src/app/api/analyze/route.ts` | `POST` |
| `/api/auth/signout` | POST | `src/app/api/auth/signout/route.ts` | `POST` |
| `/fragments` | GET | `src/lib/supabase.ts` | `getFragments()` |
| `/fragments` | POST | `src/lib/supabase.ts` | `createFragment()` |
| `/fragments/{id}` | DELETE | `src/lib/supabase.ts` | `deleteFragment()` |
| `/fragments/batch-delete` | POST | `src/lib/supabase.ts` | `deleteFragments()` |
| `/stories` | GET | `src/lib/supabase.ts` | `getStories()` |
| `/stories` | POST | `src/lib/supabase.ts` | `createStory()` |
| `/tags` | GET | `src/lib/supabase.ts` | `getTags()` |
| `/tags` | POST | `src/lib/supabase.ts` | `createTag()` |
| `/ai-history` | GET | `src/lib/supabase.ts` | `getAIHistory()` |

### 2. 数据库 Schema → 代码实现

| 表名 | Schema 定义 | TypeScript 类型 | 操作函数 |
|------|------------|-----------------|----------|
| `fragments` | `spec/database.schema.sql` | `src/types/index.ts:Fragment` | `src/lib/supabase.ts` |
| `stories` | `spec/database.schema.sql` | `src/types/index.ts:Story` | `src/lib/supabase.ts` |
| `tags` | `spec/database.schema.sql` | `src/types/index.ts:Tag` | `src/lib/supabase.ts` |
| `fragment_tags` | `spec/database.schema.sql` | (关系表) | `addTagToFragment()` |
| `ai_analysis_history` | `spec/database.schema.sql` | `src/types/index.ts:AIAnalysisHistory` | `src/lib/supabase.ts` |

### 3. 架构规范 → 代码实现

| 架构组件 | 规范定义 | 实现位置 |
|----------|----------|----------|
| 认证中间件 | `architecture.md` | `src/middleware.ts` |
| 浏览器客户端 | `architecture.md` | `src/lib/supabase-client.ts` |
| 服务端客户端 | `architecture.md` | `src/lib/supabase-server.ts` |
| 中间件客户端 | `architecture.md` | `src/lib/supabase-middleware.ts` |
| 数据操作层 | `architecture.md` | `src/lib/supabase.ts` |
| 用户菜单组件 | `architecture.md` | `src/components/UserMenu.tsx` |
| Studio 组件 | `architecture.md` | `src/app/studio/components/*.tsx` |

### 4. 类型定义映射

```
OpenAPI Schema                    TypeScript Interface
─────────────────                 ─────────────────────

Fragment                          interface Fragment
├── id: uuid                      ├── id: string
├── content: string               ├── content: string
├── story_id: uuid?               ├── story_id?: string
├── user_id: uuid                 ├── user_id: string
├── sort_order: int               ├── sort_order: number
├── created_at: datetime          ├── created_at: string
└── updated_at: datetime          └── updated_at?: string

Story                             interface Story
├── id: uuid                      ├── id: string
├── title: string                 ├── title: string
├── description: string?          ├── description?: string
├── color: string                 ├── color: string
├── user_id: uuid                 ├── (implicit via RLS)
├── created_at: datetime          ├── created_at: string
└── updated_at: datetime          └── updated_at?: string

AIAnalysisResult                  interface AIAnalysisResult
├── groups: AIGroup[]             ├── groups: AIGroup[]
└── suggestions: string[]         └── suggestions: string[]
```

### 5. RLS 策略映射

| 表 | RLS 策略 | 实现位置 |
|---|----------|----------|
| `fragments` | Users can CRUD their own | `spec/database.schema.sql` |
| `stories` | Users can CRUD their own | `spec/database.schema.sql` |
| `tags` | Users can CRUD their own | `spec/database.schema.sql` |
| `fragment_tags` | Users can manage their fragments' tags | `spec/database.schema.sql` |
| `ai_analysis_history` | Users can CRUD their own | `spec/database.schema.sql` |

## 验证矩阵

| 规范文件 | 验证方式 | 验证命令 |
|---------|----------|----------|
| `openapi.yaml` | Spectral | `spectral lint spec/openapi.yaml` |
| `database.schema.sql` | SQL 解析 | 在 Supabase 执行 |
| `architecture.md` | 代码检查 | `node spec/validate.js` |
| `testing.md` | 测试运行 | `npm test` |

## 维护指南

### 添加新 API 端点

1. **更新 OpenAPI 规范**
   ```yaml
   # spec/openapi.yaml
   /new-endpoint:
     post:
       # ... 定义
   ```

2. **生成类型** (可选)
   ```bash
   npx openapi-typescript spec/openapi.yaml -o src/types/api.types.ts
   ```

3. **实现代码**
   ```typescript
   // src/app/api/new-endpoint/route.ts
   export async function POST(request: Request) {
     // 按照 OpenAPI 规范实现
   }
   ```

4. **验证**
   ```bash
   node spec/validate.js
   ```

### 修改数据库 Schema

1. **更新 Schema 文档**
   ```sql
   -- spec/database.schema.sql
   ALTER TABLE fragments ADD COLUMN new_field TYPE;
   ```

2. **创建迁移**
   ```bash
   # supabase/migrations/XXX_add_new_field.sql
   ```

3. **更新类型**
   ```typescript
   // src/types/index.ts
   interface Fragment {
     new_field: Type;
   }
   ```

4. **验证**
   ```bash
   node spec/validate.js
   ```

## 一致性检查

运行以下命令确保规范与代码一致：

```bash
# 1. 验证规范文件完整性
node spec/validate.js

# 2. 验证 OpenAPI 规范
npx @stoplight/spectral-cli lint spec/openapi.yaml

# 3. 类型检查
npx tsc --noEmit

# 4. 代码规范检查
npm run lint

# 5. 运行测试
npm run test
```

---

> 📌 **注意**: 规范是代码的唯一真相来源。任何不一致都应以规范为准进行调整。
