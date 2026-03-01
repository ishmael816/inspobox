# InspoBox 规范文档中心

欢迎来到 InspoBox 的 **Spec-Driven Development (SDD)** 规范文档中心。

## 📚 规范文档清单

| 文档 | 说明 | 状态 |
|------|------|------|
| [openapi.yaml](./openapi.yaml) | OpenAPI 3.1 API 规范 | ✅ 完整 |
| [database.schema.sql](./database.schema.sql) | PostgreSQL 数据库 Schema | ✅ 完整 |
| [architecture.md](./architecture.md) | 系统架构设计规范 | ✅ 完整 |
| [testing.md](./testing.md) | 测试策略与规范 | ✅ 完整 |
| [SDD_WORKFLOW.md](./SDD_WORKFLOW.md) | SDD 工作流指南 | ✅ 完整 |
| [validate.js](./validate.js) | 规范验证脚本 | ✅ 可用 |

## 🚀 快速开始

### 1. 验证项目规范

```bash
node spec/validate.js
```

### 2. 查看 API 文档

使用 Swagger UI 或类似工具打开 `openapi.yaml`：

```bash
# 使用 Docker 运行 Swagger UI
docker run -p 80:8080 -e SWAGGER_JSON=/spec/openapi.yaml -v $(pwd)/spec:/spec swaggerapi/swagger-ui

# 或使用 VS Code 插件: OpenAPI (Swagger) Editor
```

### 3. 生成 TypeScript 类型

```bash
# 从 OpenAPI 生成 API 类型
npx openapi-typescript spec/openapi.yaml -o src/types/api.types.ts

# 从 Supabase 生成数据库类型
npx supabase gen types typescript --project-id your-project > src/lib/database.types.ts
```

## 📖 文档说明

### OpenAPI 规范 (openapi.yaml)

定义了所有 API 端点：
- **Authentication**: 用户认证相关接口
- **Fragments**: 灵感碎片 CRUD
- **Stories**: 故事管理
- **Tags**: 标签管理
- **AI**: AI 分析与重组

### 数据库规范 (database.schema.sql)

完整的 PostgreSQL Schema：
- 表结构设计
- 字段约束
- 索引优化
- RLS (行级安全) 策略
- 触发器

### 架构规范 (architecture.md)

系统设计文档：
- 技术栈选择
- 项目结构
- 数据流设计
- 组件设计
- 安全规范
- 性能优化

### 测试规范 (testing.md)

测试策略：
- 单元测试
- 集成测试
- E2E 测试
- 测试覆盖率目标
- 测试数据工厂

### SDD 工作流 (SDD_WORKFLOW.md)

规范驱动开发方法论：
- 什么是 SDD
- 工作流程
- 工具链
- 最佳实践

## 🔧 开发工作流

```
需求变更
    │
    ▼
┌─────────────────────────────────────┐
│ 1. 更新相关规范文档                  │
│    - openapi.yaml (API 变更)         │
│    - database.schema.sql (数据变更)  │
│    - architecture.md (架构变更)      │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 2. 评审规范                          │
│    - 团队 Review                     │
│    - 确保完整性                      │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 3. 生成代码                          │
│    - npx openapi-typescript          │
│    - npx supabase gen types          │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 4. 实现功能                          │
│    - 按照规范编写代码                │
│    - 编写测试                        │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 5. 验证                              │
│    - node spec/validate.js           │
│    - npm run test                    │
│    - npm run lint                    │
└─────────────────────────────────────┘
```

## ✅ 规范检查清单

### API 设计
- [ ] 所有端点都有 OpenAPI 定义
- [ ] 请求/响应 Schema 完整
- [ ] 错误响应定义清晰
- [ ] 安全方案配置正确

### 数据库
- [ ] 表结构符合 Schema 定义
- [ ] RLS 策略已启用
- [ ] 索引已创建
- [ ] 外键约束正确

### 代码
- [ ] TypeScript 类型完整
- [ ] 组件命名符合规范
- [ ] 错误处理完善
- [ ] 测试覆盖率达到目标

## 🛠️ 工具推荐

| 用途 | 工具 |
|------|------|
| API 设计 | [Swagger Editor](https://editor.swagger.io/) |
| API 测试 | Postman, Insomnia |
| API Mock | [Prism](https://stoplight.io/open-source/prism) |
| 类型生成 | `openapi-typescript` |
| 规范验证 | `spectral` |
| 数据库设计 | [dbdiagram.io](https://dbdiagram.io/) |

## 📊 规范统计

```
OpenAPI 规范
├── 端点数量: 15+
├── 数据模型: 10+
└── 安全方案: 2

数据库 Schema
├── 表数量: 5
├── 索引数量: 10+
├── RLS 策略: 5
└── 触发器: 2

架构文档
├── 组件数量: 10+
├── API 路由: 2
└── 工具函数: 15+
```

## 🤝 贡献规范

1. **规范先行**: 任何变更先更新规范文档
2. **评审必填**: 规范变更需要团队评审
3. **自动化**: 使用脚本验证规范合规性
4. **文档同步**: 保持 README 和代码注释同步

## 📞 支持

如有问题，请查看：
- [项目 README](../README.md)
- [认证配置](../AUTH_SETUP.md)
- [部署文档](../DEPLOY.md)

---

> 💡 **SDD 核心理念**: 规范是代码的蓝图，代码是规范的实现。
