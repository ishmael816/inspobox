# InspoBox 测试规范

> 更新日期: 2026-03-01
> 版本: 2.0

## 1. 测试策略

### 1.1 测试金字塔

```
         /\
        /  \
       / E2E\          (少而精: 关键用户流程)
      /______\
     /        \
    /Integration\      (中等: API, 数据库)
   /______________\
  /                \
 /   Unit Tests      \   (大量: 函数, 组件)
/______________________\
```

### 1.2 测试覆盖率目标

| 类型 | 目标覆盖率 | 优先级 | 当前状态 |
|------|-----------|--------|----------|
| 单元测试 | > 80% | P0 | 🚧 待实现 |
| 集成测试 | > 60% | P1 | 🚧 待实现 |
| E2E 测试 | 关键路径 | P1 | 🚧 待实现 |

### 1.3 功能测试矩阵

| 功能模块 | 单元测试 | 集成测试 | E2E 测试 | 优先级 |
|----------|---------|---------|---------|--------|
| 用户认证 | ✅ | ✅ | ✅ | P0 |
| 灵感捕捉 | ✅ | ✅ | ✅ | P0 |
| 故事管理 | ✅ | ✅ | ✅ | P0 |
| 标签系统 | ✅ | ✅ | ✅ | P0 |
| AI 分析 | ✅ | ✅ | ⚠️ | P1 |
| **搜索功能** | ✅ | ✅ | ⚠️ | P1 |
| **批量编辑** | ✅ | ✅ | ⚠️ | P1 |
| **AI关联探索** | ✅ | ✅ | ⚠️ | P1 |

## 2. 快速开始

### 2.1 运行所有测试

```bash
# 安装依赖
npm install

# 运行单元测试
npm run test

# 运行测试并查看覆盖率
npm run test:coverage

# 运行 E2E 测试
npm run test:e2e

# 运行所有测试
npm run test:all
```

### 2.2 开发模式

```bash
# 启动开发服务器
npm run dev

# 运行测试（监视模式）
npm run test:watch
```

## 3. 测试目录结构

```
__tests__/
├── unit/
│   ├── lib/
│   │   ├── supabase.test.ts              # 数据操作函数
│   │   ├── prompts.test.ts               # AI 提示词
│   │   └── utils.test.ts                 # 工具函数
│   ├── components/
│   │   ├── UserMenu.test.tsx
│   │   ├── FragmentCard.test.tsx
│   │   ├── SearchBar.test.tsx            # 搜索组件
│   │   ├── BatchActions.test.tsx         # 批量操作
│   │   └── RelationExplorer.test.tsx     # 关联探索
│   └── hooks/
│       └── useFragments.test.ts
├── integration/
│   ├── api/
│   │   ├── analyze.test.ts               # AI 分析 API
│   │   ├── search.test.ts                # 搜索 API
│   │   ├── relations.test.ts             # 关联 API
│   │   └── batch-update.test.ts          # 批量更新 API
│   └── database/
│       ├── rls.test.ts                   # 行级安全
│       └── relations.test.ts             # 关联表
├── e2e/
│   ├── auth.spec.ts
│   ├── fragment.spec.ts
│   ├── search.spec.ts                    # 搜索流程
│   ├── batch-edit.spec.ts                # 批量编辑
│   └── ai-relations.spec.ts              # AI 关联
└── fixtures/
    ├── factories.ts                      # 测试数据工厂
    ├── fragments.json
    ├── stories.json
    └── tags.json
```

## 4. 单元测试规范

### 4.1 组件测试示例

#### SearchBar 组件测试

```typescript
// __tests__/components/SearchBar.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar } from '@/components/SearchBar';

describe('SearchBar', () => {
  it('renders search input', () => {
    render(<SearchBar onSearchResults={jest.fn()} />);
    expect(screen.getByPlaceholderText('搜索灵感...')).toBeInTheDocument();
  });

  it('shows suggestions on input', async () => {
    render(<SearchBar onSearchResults={jest.fn()} />);
    const input = screen.getByPlaceholderText('搜索灵感...');
    
    fireEvent.change(input, { target: { value: 'test' } });
    
    await waitFor(() => {
      expect(screen.getByText('故事')).toBeInTheDocument();
    });
  });

  it('triggers search on enter', async () => {
    const onSearchResults = jest.fn();
    render(<SearchBar onSearchResults={onSearchResults} />);
    
    const input = screen.getByPlaceholderText('搜索灵感...');
    fireEvent.change(input, { target: { value: 'keyword' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(onSearchResults).toHaveBeenCalled();
    });
  });

  it('clears search on escape', () => {
    render(<SearchBar onSearchResults={jest.fn()} onClearSearch={jest.fn()} />);
    const input = screen.getByPlaceholderText('搜索灵感...');
    
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    
    expect(input).toHaveValue('');
  });
});
```

#### BatchActions 组件测试

```typescript
// __tests__/components/BatchActions.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BatchActions } from '@/components/BatchActions';

describe('BatchActions', () => {
  const mockProps = {
    selectedIds: new Set(['id1', 'id2']),
    stories: [{ id: 's1', title: 'Story 1', color: '#3b82f6' }],
    tags: [{ id: 't1', name: 'Tag 1', color: '#10b981' }],
    onClearSelection: jest.fn(),
    onActionComplete: jest.fn(),
  };

  it('renders selected count', () => {
    render(<BatchActions {...mockProps} />);
    expect(screen.getByText('已选择 2 个')).toBeInTheDocument();
  });

  it('opens move to story dropdown', () => {
    render(<BatchActions {...mockProps} />);
    fireEvent.click(screen.getByText('移动'));
    expect(screen.getByText('选择目标故事')).toBeInTheDocument();
  });

  it('confirms delete action', () => {
    render(<BatchActions {...mockProps} />);
    fireEvent.click(screen.getByLabelText('删除'));
    expect(screen.getByText('确认删除')).toBeInTheDocument();
  });
});
```

### 4.2 API 测试示例

#### 搜索 API 测试

```typescript
// __tests__/integration/api/search.test.ts
import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/search/route';

describe('/api/search', () => {
  it('returns 400 when query is missing', async () => {
    const { req } = createMocks({ method: 'GET' });
    const response = await GET(req);
    expect(response.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    const { req } = createMocks({
      method: 'GET',
      query: { q: 'test' }
    });
    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it('returns search results', async () => {
    // 需要 mock 认证和数据库
  });
});
```

#### 关联分析 API 测试

```typescript
// __tests__/integration/api/relations/analyze.test.ts
describe('/api/relations/analyze', () => {
  it('returns 400 when less than 2 fragments', async () => {
    const response = await fetch('/api/relations/analyze', {
      method: 'POST',
      body: JSON.stringify({ fragment_ids: ['id1'] }),
    });
    expect(response.status).toBe(400);
  });

  it('returns stream for valid request', async () => {
    // 需要 mock 认证
  });
});
```

### 4.3 工具函数测试

#### 提示词测试

```typescript
// __tests__/lib/prompts.test.ts
import { createAnalyzeUserPrompt, AI_CONFIG } from '@/lib/prompts';

describe('createAnalyzeUserPrompt', () => {
  it('generates prompt with target fragment', () => {
    const fragments = [{ id: '1', content: 'test' }];
    const target = { id: '2', content: 'target' };
    const prompt = createAnalyzeUserPrompt(fragments, target);
    
    expect(prompt).toContain('test');
    expect(prompt).toContain('target');
    expect(prompt).toContain('此刻，创作者正凝视着这一段');
  });

  it('generates prompt without target fragment', () => {
    const fragments = [{ id: '1', content: 'test' }];
    const prompt = createAnalyzeUserPrompt(fragments);
    
    expect(prompt).toContain('test');
    expect(prompt).not.toContain('此刻，创作者正凝视着');
  });
});

describe('AI_CONFIG', () => {
  it('has correct temperature settings', () => {
    expect(AI_CONFIG.analyze.temperature).toBe(0.8);
    expect(AI_CONFIG.relationAnalyze.temperature).toBe(0.6);
  });
});
```

## 5. E2E 测试规范

### 5.1 搜索流程测试

```typescript
// __tests__/e2e/search.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Search Flow', () => {
  test('user can search fragments', async ({ page }) => {
    // 登录
    await page.goto('/studio');
    
    // 在搜索框输入关键词
    await page.fill('[placeholder="搜索灵感..."]', '雨夜');
    await page.press('[placeholder="搜索灵感..."]', 'Enter');
    
    // 验证搜索结果
    await expect(page.locator('text=搜索 "雨夜"')).toBeVisible();
  });

  test('search suggestions appear on input', async ({ page }) => {
    await page.goto('/studio');
    
    await page.fill('[placeholder="搜索灵感..."]', '故事');
    
    // 等待建议出现
    await expect(page.locator('text=故事')).toBeVisible();
  });
});
```

### 5.2 批量编辑测试

```typescript
// __tests__/e2e/batch-edit.spec.ts
test.describe('Batch Edit Flow', () => {
  test('user can select multiple fragments', async ({ page }) => {
    await page.goto('/studio');
    
    // 进入编辑模式
    await page.click('text=编辑');
    
    // 选择多个碎片
    await page.click('[data-testid="select-fragment"]:first-child');
    await page.click('[data-testid="select-fragment"]:nth-child(2)');
    
    // 验证批量操作栏出现
    await expect(page.locator('text=已选择 2 个')).toBeVisible();
  });

  test('user can batch move to story', async ({ page }) => {
    // ... 测试批量移动
  });
});
```

### 5.3 AI 关联探索测试

```typescript
// __tests__/e2e/ai-relations.spec.ts
test.describe('AI Relations Flow', () => {
  test('user can analyze fragment relations', async ({ page }) => {
    await page.goto('/studio');
    
    // 点击关联探索按钮
    await page.click('text=关联探索');
    
    // 点击 AI 分析
    await page.click('text=AI 分析关联');
    
    // 等待分析完成
    await expect(page.locator('text=AI 发现了')).toBeVisible({ timeout: 30000 });
  });

  test('user can switch between views', async ({ page }) => {
    await page.goto('/studio');
    await page.click('text=关联探索');
    
    // 切换不同视图
    await page.click('text=图谱');
    await page.click('text=分组');
    await page.click('text=时间线');
    await page.click('text=主题');
  });
});
```

## 6. 测试数据工厂

```typescript
// __tests__/fixtures/factories.ts
import { Factory } from 'fishery';
import { Fragment, Story, Tag } from '@/types';

export const StoryFactory = Factory.define<Story>(({ sequence }) => ({
  id: `story-${sequence}`,
  title: `Story ${sequence}`,
  description: `Description for story ${sequence}`,
  color: '#3b82f6',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

export const TagFactory = Factory.define<Tag>(({ sequence }) => ({
  id: `tag-${sequence}`,
  name: `Tag ${sequence}`,
  color: '#10b981',
  created_at: new Date().toISOString(),
}));

export const FragmentFactory = Factory.define<Fragment>(({ sequence }) => ({
  id: `fragment-${sequence}`,
  content: `This is fragment content ${sequence}. It contains some creative writing ideas.`,
  sort_order: sequence,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  story: StoryFactory.build(),
  tags: TagFactory.buildList(2),
}));
```

## 7. 性能测试

```typescript
// __tests__/performance/search.perf.ts
describe('Search Performance', () => {
  it('completes search within 500ms', async () => {
    const start = Date.now();
    await fetch('/api/search?q=test');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });
});
```

## 8. 测试检查清单

### 发布前检查

- [ ] 所有单元测试通过
- [ ] 覆盖率达标 (>80%)
- [ ] 关键路径 E2E 测试通过
- [ ] 跨浏览器测试通过
- [ ] 移动端测试通过
- [ ] 性能基准测试通过

### 新增功能检查

- [ ] 为新功能编写单元测试
- [ ] 为新 API 编写集成测试
- [ ] 更新 E2E 测试覆盖新流程
- [ ] 更新测试文档

## 9. 命令速查

```bash
# 开发
npm run dev              # 启动开发服务器
npm run test:watch       # 监视模式运行测试

# 测试
npm run test             # 运行单元测试
npm run test:coverage    # 运行测试并生成覆盖率报告
npm run test:e2e         # 运行 E2E 测试
npm run test:e2e:ui      # 以 UI 模式运行 E2E 测试
npm run test:all         # 运行所有测试

# 代码质量
npm run lint             # 运行 ESLint
npm run type-check       # 运行 TypeScript 类型检查
npm run validate         # 运行 SDD 规范验证
```

---

**最后更新**: 2026-03-01  
**测试框架**: Jest + React Testing Library + Playwright
