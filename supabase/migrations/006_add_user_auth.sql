-- ============================================
-- 用户认证改造 - 为所有表添加用户隔离
-- ============================================

-- 1. 为 stories 表添加 user_id 并更新 RLS
ALTER TABLE stories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);

-- 更新 stories 的 RLS 策略
DROP POLICY IF EXISTS "Allow anonymous insert on stories" ON stories;
DROP POLICY IF EXISTS "Allow anonymous select on stories" ON stories;
DROP POLICY IF EXISTS "Allow anonymous update on stories" ON stories;
DROP POLICY IF EXISTS "Allow anonymous delete on stories" ON stories;

CREATE POLICY "Users can only access their own stories" ON stories
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. 为 tags 表添加 user_id 并更新 RLS
ALTER TABLE tags ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

-- 更新 tags 的 RLS 策略
DROP POLICY IF EXISTS "Allow anonymous insert on tags" ON tags;
DROP POLICY IF EXISTS "Allow anonymous select on tags" ON tags;
DROP POLICY IF EXISTS "Allow anonymous update on tags" ON tags;
DROP POLICY IF EXISTS "Allow anonymous delete on tags" ON tags;

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

CREATE POLICY "Users can only access their own fragments" ON fragments
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. 更新 fragment_tags 的 RLS（通过关联检查权限）
DROP POLICY IF EXISTS "Allow anonymous insert on fragment_tags" ON fragment_tags;
DROP POLICY IF EXISTS "Allow anonymous select on fragment_tags" ON fragment_tags;
DROP POLICY IF EXISTS "Allow anonymous delete on fragment_tags" ON fragment_tags;

-- fragment_tags 继承 fragments 的权限
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

CREATE POLICY "Users can only access their own ai_history" ON ai_analysis_history
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. 迁移现有数据（如果需要保留匿名数据，可以跳过此步骤或手动处理）
-- 注意：现有匿名数据将无法被任何用户访问，建议清空或手动分配

-- 7. 创建触发器：自动设置 user_id
-- 这个可选，取决于你是否想在应用层还是数据库层设置 user_id

-- 8. 清理旧的 anon 策略（确保没有遗漏）
-- 已经通过 DROP POLICY IF EXISTS 清理
