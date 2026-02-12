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
CREATE POLICY "Allow anonymous insert on ai_history" ON ai_analysis_history
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select on ai_history" ON ai_analysis_history
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous delete on ai_history" ON ai_analysis_history
  FOR DELETE TO anon USING (true);
