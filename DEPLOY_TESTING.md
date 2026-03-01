# InspoBox 部署测试指南

> 全面测试 checklist，确保部署成功

## 📋 测试流程概览

```
本地开发测试 → 构建测试 → 部署前检查 → 部署 → 生产环境验证 → 监控
```

---

## 第一阶段：本地开发测试

### 1.1 启动开发服务器

```bash
# 进入项目目录
cd inspobox

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 1.2 功能测试清单

打开浏览器访问 http://localhost:3000

#### ✅ 认证功能
| 测试项 | 操作 | 预期结果 |
|--------|------|----------|
| 注册 | 点击"创建账户"，填写邮箱密码 | 注册成功，跳转到首页 |
| 登录 | 使用已注册账号登录 | 登录成功，显示用户头像 |
| 登出 | 点击用户菜单 → 退出 | 登出成功，回到登录页 |
| 路由保护 | 未登录访问 /studio | 自动跳转到登录页 |

#### ✅ 灵感捕捉
| 测试项 | 操作 | 预期结果 |
|--------|------|----------|
| 创建碎片 | 首页输入内容，按 Enter | 保存成功，显示飞入动画 |
| 关联故事 | 输入内容 → 选择故事 → 保存 | 碎片关联到指定故事 |
| 添加标签 | 输入内容 → 选择标签 → 保存 | 碎片包含标签 |
| 创建新故事 | 点击"+ 新故事" | 创建成功并自动选中 |
| 创建新标签 | 点击"+ 新标签" | 创建成功并自动选中 |

#### ✅ Studio 页面
| 测试项 | 操作 | 预期结果 |
|--------|------|----------|
| 查看碎片 | 进入 /studio | 显示所有碎片，瀑布流布局 |
| 切换故事 | 点击顶部故事标签 | 筛选对应故事的碎片 |
| 标签筛选 | 展开筛选 → 点击标签 | 显示含该标签的碎片 |
| 排序切换 | 选择"最新"/"最早"/"随机" | 碎片按指定方式排序 |
| 搜索功能 | 顶部搜索框输入关键词 | 实时显示搜索结果 |
| 进入编辑模式 | 点击"编辑"按钮 | 碎片显示复选框 |
| 批量选择 | 点击多个碎片复选框 | 底部显示批量操作栏 |
| 批量移动到故事 | 选中碎片 → 移动 → 选择故事 | 碎片移动成功 |
| 批量添加标签 | 选中碎片 → 加标签 → 选择标签 | 标签添加成功 |
| 批量删除 | 选中碎片 → 删除 → 确认 | 碎片删除成功 |
| AI 重组 | 选中碎片 → 点击右下角 AI 按钮 | 显示 AI 分析结果 |

#### ✅ AI 关联探索
| 测试项 | 操作 | 预期结果 |
|--------|------|----------|
| 打开关联探索 | 点击右下角紫色"关联探索" | 侧边栏打开 |
| AI 分析关联 | 点击"AI 分析关联" | 显示流式响应，分析完成 |
| 查看推荐 | 切换到"推荐"标签 | 显示 AI 推荐的关联 |
| 接受推荐 | 点击"确认关联" | 推荐转为正式关联 |
| 拒绝推荐 | 点击"忽略" | 推荐消失 |
| 查看图谱 | 切换到"图谱"标签 | 显示力导向图 |
| 查看分组 | 切换到"分组"标签 | 显示智能分组卡片 |
| 查看时间线 | 切换到"时间线"标签 | 显示叙事时间线 |
| 查看主题 | 切换到"主题"标签 | 显示主题聚类 |

---

## 第二阶段：构建测试

### 2.1 类型检查

```bash
npm run type-check
# 或
npx tsc --noEmit
```

**预期结果**: 无错误（只显示 spec/validate-spec.ts 的 yaml 模块错误，已排除在构建外）

### 2.2 生产构建

```bash
npm run build
```

**预期结果**:
```
✓ Compiled successfully
✓ Generating static pages (8/8)
✓ Finalizing page optimization
```

### 2.3 生产构建测试

```bash
# 启动生产服务器
npm start

# 访问 http://localhost:3000
# 重复第一阶段的所有功能测试
```

---

## 第三阶段：部署前检查

### 3.1 环境变量检查

```bash
# 检查 .env.local 文件
cat .env.local
```

确认包含：
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ DASHSCOPE_API_KEY

### 3.2 数据库迁移状态

```bash
# 检查迁移文件是否存在
ls supabase/migrations/

# 确认需要执行的迁移
# 007_add_fulltext_search.sql
# 008_add_fragment_relations.sql
```

### 3.3 Supabase 配置检查

登录 https://app.supabase.com

#### Authentication → URL Configuration
| 配置项 | 值 |
|--------|-----|
| Site URL | https://your-domain.com |
| Redirect URLs | https://your-domain.com/** |

#### SQL Editor
执行以下查询确认迁移已应用：

```sql
-- 检查全文搜索
SELECT * FROM pg_indexes WHERE tablename = 'fragments';
-- 应看到 idx_fragments_search

-- 检查关联表
SELECT * FROM information_schema.tables 
WHERE table_name IN ('fragment_relations', 'fragment_relation_suggestions');
-- 应返回 2 条记录
```

### 3.4 代码检查

```bash
# 运行 ESLint
npm run lint

# 运行规范验证
node spec/validate.js
# 预期: ✅ 所有检查通过
```

---

## 第四阶段：部署

### 4.1 Vercel 部署

```bash
# 登录
vercel login

# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
```

### 4.2 Railway 部署

```bash
# 登录
railway login

# 部署
railway up

# 生成域名
railway domain
```

---

## 第五阶段：生产环境验证

### 5.1 基础访问测试

| 测试项 | URL | 预期结果 |
|--------|-----|----------|
| 首页 | https://your-domain.com | 显示灵感捕捉页面 |
| Studio | https://your-domain.com/studio | 显示创作工作室 |
| 登录 | https://your-domain.com/login | 显示登录表单 |

### 5.2 API 测试

使用 curl 或 Postman 测试 API：

```bash
# 测试搜索 API
curl "https://your-domain.com/api/search?q=test" \
  -H "Cookie: sb-access-token=YOUR_TOKEN"

# 预期: 返回 JSON 格式的搜索结果
```

### 5.3 端到端测试

在浏览器中完成以下完整流程：

```
1. 注册新账号 → 验证邮箱 → 登录
2. 创建 3-5 个灵感碎片（包含不同故事和标签）
3. 在 Studio 中搜索关键词
4. 进入编辑模式，批量选择碎片
5. 批量移动到另一个故事
6. 批量添加标签
7. 打开 AI 关联探索
8. 点击 AI 分析关联，等待完成
9. 切换所有 5 个视图，确认正常显示
10. 登出账号
```

### 5.4 性能测试

使用 Chrome DevTools:

1. **Network 面板**
   - 检查 API 响应时间 (< 500ms)
   - 检查资源加载是否正常

2. **Lighthouse**
   - Performance > 70
   - Accessibility > 90
   - Best Practices > 90
   - SEO > 90

### 5.5 响应式测试

在不同设备上测试：

| 设备 | 尺寸 | 测试内容 |
|------|------|----------|
| 桌面 | 1920x1080 | 完整功能 |
| 笔记本 | 1366x768 | 完整功能 |
| iPad | 768x1024 | 触摸操作 |
| iPhone | 375x812 | 移动端布局 |

---

## 第六阶段：监控与维护

### 6.1 日志检查

#### Vercel
- 访问 https://vercel.com/dashboard
- 查看 Functions 日志
- 检查错误率

#### Railway
```bash
railway logs
```

### 6.2 错误监控

检查浏览器 Console：
```javascript
// 应无红色错误
// 黄色警告可接受
```

### 6.3 用户反馈收集

创建反馈渠道：
- 联系邮箱
- 问题反馈表单
- 使用数据分析

---

## 🚨 常见问题排查

### 问题 1: 构建失败

**症状**: `npm run build` 报错

**解决**:
```bash
# 清除缓存
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### 问题 2: API 500 错误

**症状**: API 返回 500

**排查**:
1. 检查环境变量是否配置正确
2. 检查 Supabase 连接
3. 查看 Functions 日志

### 问题 3: AI 分析失败

**症状**: AI 分析无响应或报错

**排查**:
1. 检查 DASHSCOPE_API_KEY
2. 检查碎片数量 (2-50 个)
3. 检查网络连接

### 问题 4: 数据库错误

**症状**: 数据查询失败

**排查**:
```sql
-- 检查表是否存在
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public';

-- 检查 RLS 策略
SELECT * FROM pg_policies 
WHERE tablename = 'fragments';
```

---

## 📊 测试报告模板

```markdown
# InspoBox 部署测试报告

**日期**: 2026-XX-XX
**版本**: v2.0
**测试人**: XXX

## 测试结果摘要

| 类别 | 通过 | 失败 | 跳过 |
|------|------|------|------|
| 功能测试 | 20 | 0 | 0 |
| API 测试 | 8 | 0 | 0 |
| UI 测试 | 15 | 0 | 0 |
| 性能测试 | 4 | 0 | 0 |

## 发现问题

### 问题 #1
- **描述**: ...
- **严重程度**: 高/中/低
- **状态**: 已修复/待修复

## 结论

✅ 测试通过，可以上线
⚠️ 有条件通过，需要修复以下问题
❌ 测试未通过，需要修复后重新测试
```

---

## ✅ 最终检查清单

### 部署前
- [ ] 所有本地测试通过
- [ ] 构建成功无错误
- [ ] 环境变量已配置
- [ ] 数据库迁移已执行
- [ ] Supabase URL 配置已更新

### 部署后
- [ ] 网站可以正常访问
- [ ] 注册/登录功能正常
- [ ] 创建/查看碎片正常
- [ ] 搜索功能正常
- [ ] 批量编辑正常
- [ ] AI 关联探索正常
- [ ] 移动端显示正常
- [ ] 性能指标达标

---

**最后更新**: 2026-03-01
