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
CREATE POLICY "Allow anonymous insert on stories" ON stories
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select on stories" ON stories
  FOR SELECT TO anon USING (true);

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
