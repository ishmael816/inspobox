# InspoBox - Spec-Driven Development 工作流

## 什么是 SDD（规范驱动开发）

Spec-Driven Development (SDD) 是一种以**规范文档为核心**的开发方法论。在 SDD 中：

1. **先写规范** → API 规范、数据库规范、架构规范
2. **评审规范** → 团队评审，确保完整性
3. **生成代码** → 基于规范生成类型、API 客户端、测试用例
4. **实现功能** → 按照规范编写代码
5. **验证实现** → 对比规范验证实现正确性

## 本项目规范文件清单

```
spec/
├── openapi.yaml           # OpenAPI 3.1 规范
├── database.schema.sql    # 数据库 Schema 规范
├── architecture.md        # 架构设计规范
├── testing.md            # 测试规范
└── SDD_WORKFLOW.md       # 本工作流文档
```

## SDD 工作流步骤

### Phase 1: 需求 → 规范 (Design)

```
需求分析
    │
    ▼
┌─────────────────────────────────────┐
│ 1. 定义数据模型 (Database Schema)    │
│    - 表结构                          │
│    - 字段类型和约束                  │
│    - 索引和 RLS 策略                 │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 2. 定义 API 规范 (OpenAPI)           │
│    - 端点路径                        │
│    - 请求/响应格式                   │
│    - 错误处理                        │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 3. 定义架构规范 (Architecture)       │
│    - 技术栈选择                      │
│    - 组件设计                        │
│    - 数据流                          │
└─────────────────────────────────────┘
    │
    ▼
规范评审 (Spec Review)
```

### Phase 2: 规范 → 代码 (Generate)

```bash
# 1. 从 OpenAPI 生成 TypeScript 类型
npx openapi-typescript spec/openapi.yaml -o src/types/api.types.ts

# 2. 从数据库 Schema 生成类型
npx supabase gen types typescript --project-id your-project > src/types/database.types.ts

# 3. 生成 API 客户端 (可选)
npx @openapitools/openapi-generator-cli generate \
  -i spec/openapi.yaml \
  -g typescript-fetch \
  -o src/lib/api-client
```

### Phase 3: 代码实现 (Implement)

```
按照规范实现
    │
    ├──▶ 数据库迁移 (Supabase migrations)
    │    对应: spec/database.schema.sql
    │
    ├──▶ API 路由实现 (Next.js API Routes)
    │    对应: spec/openapi.yaml
    │
    ├──▶ 组件实现 (React Components)
    │    对应: spec/architecture.md
    │
    └──▶ 测试实现
         对应: spec/testing.md
```

### Phase 4: 验证 (Validate)

```bash
# 1. 验证 API 实现是否符合 OpenAPI 规范
npx @stoplight/spectral lint spec/openapi.yaml

# 2. 运行测试
npm run test
npm run test:e2e

# 3. 类型检查
npx tsc --noEmit

# 4. 代码规范检查
npm run lint
```

## 规范更新流程

当需求变更时，**必须先更新规范，再更新代码**：

```
需求变更
    │
    ▼
更新 OpenAPI 规范
    │
    ▼
更新数据库 Schema (如需要)
    │
    ▼
更新架构文档 (如需要)
    │
    ▼
代码评审 (关注: 实现是否符合新规范)
    │
    ▼
实现代码变更
    │
    ▼
更新测试 (确保覆盖新规范)
```

## 工具链

| 目的 | 工具 | 命令 |
|------|------|------|
| API 规范验证 | Spectral | `spectral lint spec/openapi.yaml` |
| 类型生成 | openapi-typescript | `openapi-typescript spec/openapi.yaml -o types.ts` |
| API 测试 | Postman / Insomnia | 导入 openapi.yaml |
| Mock 服务器 | Prism | `prism mock spec/openapi.yaml` |
| 文档生成 | Swagger UI | 使用 openapi.yaml |

## 最佳实践

### 1. 规范即文档
- 规范文件是唯一的真相来源 (Single Source of Truth)
- 代码实现必须与规范保持一致
- 文档直接从规范生成

### 2. 版本控制
```yaml
# spec/openapi.yaml
info:
  version: 1.0.0  # 使用语义化版本
```

规范版本变更规则：
- **Major**: 破坏性变更 (Breaking Changes)
- **Minor**: 新增功能 (New Features)
- **Patch**: 修复/优化 (Fixes)

### 3. 评审清单

#### OpenAPI 规范评审
- [ ] 所有端点都有正确的 HTTP 方法
- [ ] 请求/响应 Schema 完整
- [ ] 错误响应定义清晰
- [ ] 安全方案配置正确
- [ ] 示例数据合理

#### 数据库规范评审
- [ ] 所有表都有主键
- [ ] 外键约束正确
- [ ] RLS 策略完备
- [ ] 索引设计合理
- [ ] 字段类型和约束正确

#### 架构规范评审
- [ ] 技术栈选择合理
- [ ] 组件划分清晰
- [ ] 数据流设计正确
- [ ] 安全考虑完备

## 实际应用示例

### 场景: 新增"灵感收藏"功能

**Step 1: 更新 OpenAPI 规范**
```yaml
# spec/openapi.yaml 新增:
/fragments/{id}/favorite:
  post:
    summary: 收藏灵感
    responses:
      200:
        content:
          application/json:
            schema:
              properties:
                is_favorite:
                  type: boolean
```

**Step 2: 更新数据库 Schema**
```sql
-- spec/database.schema.sql 新增:
ALTER TABLE fragments ADD COLUMN is_favorite BOOLEAN DEFAULT false;
```

**Step 3: 生成类型**
```bash
npx openapi-typescript spec/openapi.yaml -o src/types/api.types.ts
```

**Step 4: 实现代码**
```typescript
// src/lib/supabase.ts
export async function toggleFavorite(fragmentId: string, isFavorite: boolean) {
  // 按照 OpenAPI 规范实现
}
```

**Step 5: 验证**
```bash
spectral lint spec/openapi.yaml
npm run test
```

## 总结

SDD 的核心价值：

1. **清晰沟通** - 规范是团队间的共同语言
2. **提前发现问题** - 在编码前发现设计缺陷
3. **并行开发** - 前后端可基于规范并行开发
4. **自动化** - 生成代码、测试、文档
5. **长期维护** - 规范作为系统文档持续更新

---

> 💡 **记住**: 规范先行，代码后行。规范是投资的蓝图，代码是建造的过程。
