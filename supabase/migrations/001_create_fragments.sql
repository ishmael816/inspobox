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
CREATE POLICY "Allow anonymous insert" ON fragments
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON fragments
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous update" ON fragments
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous delete" ON fragments
  FOR DELETE TO anon USING (true);
