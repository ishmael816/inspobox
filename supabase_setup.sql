-- ============================================
-- 001_create_fragments.sql
-- ============================================

-- 创建灵感碎片表
CREATE TABLE IF NOT EXISTS fragments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引优化按时间查询
CREATE INDEX IF NOT EXISTS idx_fragments_created_at 
  ON fragments(created_at DESC);

-- 启用 RLS (Row Level Security)
ALTER TABLE fragments ENABLE ROW LEVEL SECURITY;

-- MVP 阶段：允许匿名插入和查询
-- 注意：生产环境应改用认证用户策略
DROP POLICY IF EXISTS "Allow anonymous insert" ON fragments;
CREATE POLICY "Allow anonymous insert" ON fragments
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous select" ON fragments;
CREATE POLICY "Allow anonymous select" ON fragments
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous update" ON fragments;
CREATE POLICY "Allow anonymous update" ON fragments
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous delete" ON fragments;
CREATE POLICY "Allow anonymous delete" ON fragments
  FOR DELETE TO anon USING (true);

-- ============================================
-- 002_add_stories.sql
-- ============================================

-- 创建故事表
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#171717', -- 用于UI展示的故事颜色
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 修改 fragments 表，添加故事关联
ALTER TABLE fragments ADD COLUMN IF NOT EXISTS story_id UUID REFERENCES stories(id) ON DELETE SET NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_fragments_story_id ON fragments(story_id);

-- 更新 RLS 策略
DROP POLICY IF EXISTS "Allow anonymous insert on stories" ON stories;
CREATE POLICY "Allow anonymous insert on stories" ON stories
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous select on stories" ON stories;
CREATE POLICY "Allow anonymous select on stories" ON stories
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous update on stories" ON stories;
CREATE POLICY "Allow anonymous update on stories" ON stories
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 更新 fragments 的更新策略
DROP POLICY IF EXISTS "Allow anonymous update" ON fragments;
CREATE POLICY "Allow anonymous update" ON fragments
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 添加删除策略
DROP POLICY IF EXISTS "Allow anonymous delete" ON fragments;
CREATE POLICY "Allow anonymous delete" ON fragments
  FOR DELETE TO anon USING (true);

-- ============================================
-- 003_add_tags.sql
-- ============================================

-- 创建标签表
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建词条-标签关联表（多对多）
CREATE TABLE IF NOT EXISTS fragment_tags (
  fragment_id UUID REFERENCES fragments(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (fragment_id, tag_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_fragment_tags_fragment ON fragment_tags(fragment_id);
CREATE INDEX IF NOT EXISTS idx_fragment_tags_tag ON fragment_tags(tag_id);

-- RLS 策略
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragment_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert on tags" ON tags;
CREATE POLICY "Allow anonymous insert on tags" ON tags
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous select on tags" ON tags;
CREATE POLICY "Allow anonymous select on tags" ON tags
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert on fragment_tags" ON fragment_tags;
CREATE POLICY "Allow anonymous insert on fragment_tags" ON fragment_tags
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous select on fragment_tags" ON fragment_tags;
CREATE POLICY "Allow anonymous select on fragment_tags" ON fragment_tags
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous delete on fragment_tags" ON fragment_tags;
CREATE POLICY "Allow anonymous delete on fragment_tags" ON fragment_tags
  FOR DELETE TO anon USING (true);

-- ============================================
-- 004_add_sort_order.sql
-- ============================================

-- 添加手动排序字段
ALTER TABLE fragments ADD COLUMN IF NOT EXISTS sort_order FLOAT DEFAULT 0;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_fragments_sort_order ON fragments(sort_order DESC, created_at DESC);

-- 为现有数据设置默认排序值（基于创建时间倒序）
UPDATE fragments 
SET sort_order = EXTRACT(EPOCH FROM created_at) * 1000
WHERE sort_order = 0;

-- 更新 RLS 策略，允许更新 sort_order
DROP POLICY IF EXISTS "Allow anonymous update" ON fragments;
CREATE POLICY "Allow anonymous update" ON fragments
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ============================================
-- 005_add_ai_history.sql
-- ============================================

-- 创建 AI 分析历史记录表
CREATE TABLE IF NOT EXISTS ai_analysis_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fragment_ids TEXT[] NOT NULL,
  target_fragment_id TEXT,
  result JSONB NOT NULL,
  raw_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_history_created_at 
  ON ai_analysis_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_history_fragment_ids 
  ON ai_analysis_history USING GIN(fragment_ids);

-- 启用 RLS
ALTER TABLE ai_analysis_history ENABLE ROW LEVEL SECURITY;

-- 匿名访问策略
DROP POLICY IF EXISTS "Allow anonymous insert on ai_history" ON ai_analysis_history;
CREATE POLICY "Allow anonymous insert on ai_history" ON ai_analysis_history
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous select on ai_history" ON ai_analysis_history;
CREATE POLICY "Allow anonymous select on ai_history" ON ai_analysis_history
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous delete on ai_history" ON ai_analysis_history;
CREATE POLICY "Allow anonymous delete on ai_history" ON ai_analysis_history
  FOR DELETE TO anon USING (true);

-- ============================================
-- 006_add_user_auth.sql
-- ============================================

-- 用户认证改造 - 为所有表添加用户隔离

-- 1. 为 stories 表添加 user_id 并更新 RLS
ALTER TABLE stories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);

-- 更新 stories 的 RLS 策略
DROP POLICY IF EXISTS "Allow anonymous insert on stories" ON stories;
DROP POLICY IF EXISTS "Allow anonymous select on stories" ON stories;
DROP POLICY IF EXISTS "Allow anonymous update on stories" ON stories;
DROP POLICY IF EXISTS "Allow anonymous delete on stories" ON stories;

DROP POLICY IF EXISTS "Users can only access their own stories" ON stories;
CREATE POLICY "Users can only access their own stories" ON stories
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 初始化默认故事（可选）
-- 如需默认"无"故事，请取消下面注释：
-- ============================================

-- INSERT INTO stories (title, description, color, user_id) VALUES
--   ('无', '暂未归属的灵感', '#6b7280', auth.uid());

-- 2. 为 tags 表添加 user_id 并更新 RLS
ALTER TABLE tags ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

-- 更新 tags 的 RLS 策略
DROP POLICY IF EXISTS "Allow anonymous insert on tags" ON tags;
DROP POLICY IF EXISTS "Allow anonymous select on tags" ON tags;
DROP POLICY IF EXISTS "Allow anonymous update on tags" ON tags;
DROP POLICY IF EXISTS "Allow anonymous delete on tags" ON tags;

DROP POLICY IF EXISTS "Users can only access their own tags" ON tags;
CREATE POLICY "Users can only access their own tags" ON tags
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. 为 fragments 表添加 user_id 并更新 RLS
ALTER TABLE fragments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_fragments_user_id ON fragments(user_id);

-- 更新 fragments 的 RLS 策略
DROP POLICY IF EXISTS "Allow anonymous insert" ON fragments;
DROP POLICY IF EXISTS "Allow anonymous select" ON fragments;
DROP POLICY IF EXISTS "Allow anonymous update" ON fragments;
DROP POLICY IF EXISTS "Allow anonymous delete" ON fragments;

DROP POLICY IF EXISTS "Users can only access their own fragments" ON fragments;
CREATE POLICY "Users can only access their own fragments" ON fragments
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. 更新 fragment_tags 的 RLS（通过关联检查权限）
DROP POLICY IF EXISTS "Allow anonymous insert on fragment_tags" ON fragment_tags;
DROP POLICY IF EXISTS "Allow anonymous select on fragment_tags" ON fragment_tags;
DROP POLICY IF EXISTS "Allow anonymous delete on fragment_tags" ON fragment_tags;

-- fragment_tags 继承 fragments 的权限
DROP POLICY IF EXISTS "Users can only access their own fragment_tags" ON fragment_tags;
CREATE POLICY "Users can only access their own fragment_tags" ON fragment_tags
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fragments f 
      WHERE f.id = fragment_tags.fragment_id 
      AND f.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fragments f 
      WHERE f.id = fragment_tags.fragment_id 
      AND f.user_id = auth.uid()
    )
  );

-- 5. 为 ai_analysis_history 表添加 user_id 并更新 RLS
ALTER TABLE ai_analysis_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_ai_history_user_id ON ai_analysis_history(user_id);

-- 更新 ai_analysis_history 的 RLS 策略
DROP POLICY IF EXISTS "Allow anonymous insert on ai_history" ON ai_analysis_history;
DROP POLICY IF EXISTS "Allow anonymous select on ai_history" ON ai_analysis_history;
DROP POLICY IF EXISTS "Allow anonymous delete on ai_history" ON ai_analysis_history;

DROP POLICY IF EXISTS "Users can only access their own ai_history" ON ai_analysis_history;
CREATE POLICY "Users can only access their own ai_history" ON ai_analysis_history
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
