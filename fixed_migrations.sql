-- 创建灵感碎片�?CREATE TABLE IF NOT EXISTS fragments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引优化按时间查�?CREATE INDEX IF NOT EXISTS idx_fragments_created_at 
  ON fragments(created_at DESC);

-- 启用 RLS (Row Level Security)
ALTER TABLE fragments ENABLE ROW LEVEL SECURITY;

-- MVP 阶段：允许匿名插入和查询
-- 注意：生产环境应改用认证用户策略
CREATE POLICY "Allow anonymous insert" ON fragments
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON fragments
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous update" ON fragments
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous delete" ON fragments
  FOR DELETE TO anon USING (true);




-- 创建故事�?CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#171717', -- 用于UI展示的故事颜�?  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 修改 fragments 表，添加故事关联
ALTER TABLE fragments ADD COLUMN IF NOT EXISTS story_id UUID REFERENCES stories(id) ON DELETE SET NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_fragments_story_id ON fragments(story_id);

-- 更新 RLS 策略
CREATE POLICY "Allow anonymous insert on stories" ON stories
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select on stories" ON stories
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous update on stories" ON stories
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 更新 fragments 的更新策�?DROP POLICY IF EXISTS "Allow anonymous update" ON fragments;
CREATE POLICY "Allow anonymous update" ON fragments
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 添加删除策略
DROP POLICY IF EXISTS "Allow anonymous delete" ON fragments;
CREATE POLICY "Allow anonymous delete" ON fragments
  FOR DELETE TO anon USING (true);




-- 创建标签�?CREATE TABLE IF NOT EXISTS tags (
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

CREATE POLICY "Allow anonymous insert on tags" ON tags
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select on tags" ON tags
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert on fragment_tags" ON fragment_tags
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select on fragment_tags" ON fragment_tags
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous delete on fragment_tags" ON fragment_tags
  FOR DELETE TO anon USING (true);




-- 添加手动排序字段
ALTER TABLE fragments ADD COLUMN IF NOT EXISTS sort_order FLOAT DEFAULT 0;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_fragments_sort_order ON fragments(sort_order DESC, created_at DESC);

-- 为现有数据设置默认排序值（基于创建时间倒序�?UPDATE fragments 
SET sort_order = EXTRACT(EPOCH FROM created_at) * 1000
WHERE sort_order = 0;

-- 更新 RLS 策略，允许更�?sort_order
DROP POLICY IF EXISTS "Allow anonymous update" ON fragments;
CREATE POLICY "Allow anonymous update" ON fragments
  FOR UPDATE TO anon USING (true) WITH CHECK (true);




-- 创建 AI 分析历史记录�?
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
CREATE POLICY "Allow anonymous insert on ai_history" ON ai_analysis_history
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select on ai_history" ON ai_analysis_history
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous delete on ai_history" ON ai_analysis_history
  FOR DELETE TO anon USING (true);




-- ============================================
-- 用户认证改�?- 为所有表添加用户隔离
-- ============================================

-- 1. �?stories 表添�?user_id 并更�?RLS
ALTER TABLE stories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);

-- 更新 stories �?RLS 策略
DROP POLICY IF EXISTS "Allow anonymous insert on stories" ON stories;
DROP POLICY IF EXISTS "Allow anonymous select on stories" ON stories;
DROP POLICY IF EXISTS "Allow anonymous update on stories" ON stories;
DROP POLICY IF EXISTS "Allow anonymous delete on stories" ON stories;

CREATE POLICY "Users can only access their own stories" ON stories
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. �?tags 表添�?user_id 并更�?RLS
ALTER TABLE tags ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

-- 更新 tags �?RLS 策略
DROP POLICY IF EXISTS "Allow anonymous insert on tags" ON tags;
DROP POLICY IF EXISTS "Allow anonymous select on tags" ON tags;
DROP POLICY IF EXISTS "Allow anonymous update on tags" ON tags;
DROP POLICY IF EXISTS "Allow anonymous delete on tags" ON tags;

CREATE POLICY "Users can only access their own tags" ON tags
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. �?fragments 表添�?user_id 并更�?RLS
ALTER TABLE fragments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_fragments_user_id ON fragments(user_id);

-- 更新 fragments �?RLS 策略
DROP POLICY IF EXISTS "Allow anonymous insert" ON fragments;
DROP POLICY IF EXISTS "Allow anonymous select" ON fragments;
DROP POLICY IF EXISTS "Allow anonymous update" ON fragments;
DROP POLICY IF EXISTS "Allow anonymous delete" ON fragments;

CREATE POLICY "Users can only access their own fragments" ON fragments
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. 更新 fragment_tags �?RLS（通过关联检查权限）
DROP POLICY IF EXISTS "Allow anonymous insert on fragment_tags" ON fragment_tags;
DROP POLICY IF EXISTS "Allow anonymous select on fragment_tags" ON fragment_tags;
DROP POLICY IF EXISTS "Allow anonymous delete on fragment_tags" ON fragment_tags;

-- fragment_tags 继承 fragments 的权�?
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

-- 5. �?ai_analysis_history 表添�?user_id 并更�?RLS
ALTER TABLE ai_analysis_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_ai_history_user_id ON ai_analysis_history(user_id);

-- 更新 ai_analysis_history �?RLS 策略
DROP POLICY IF EXISTS "Allow anonymous insert on ai_history" ON ai_analysis_history;
DROP POLICY IF EXISTS "Allow anonymous select on ai_history" ON ai_analysis_history;
DROP POLICY IF EXISTS "Allow anonymous delete on ai_history" ON ai_analysis_history;

CREATE POLICY "Users can only access their own ai_history" ON ai_analysis_history
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. 迁移现有数据（如果需要保留匿名数据，可以跳过此步骤或手动处理�?
-- 注意：现有匿名数据将无法被任何用户访问，建议清空或手动分�?

-- 7. 创建触发器：自动设置 user_id
-- 这个可选，取决于你是否想在应用层还是数据库层设�?user_id

-- 8. 清理旧的 anon 策略（确保没有遗漏）
-- 已经通过 DROP POLICY IF EXISTS 清理

