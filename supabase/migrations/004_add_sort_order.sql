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
