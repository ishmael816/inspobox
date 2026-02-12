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
