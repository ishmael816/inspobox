-- ============================================
-- 迁移: 007_add_fulltext_search
-- 描述: 添加全文搜索支持
-- 日期: 2026-03-01
-- ============================================

-- 1. 添加搜索向量字段到 fragments 表
ALTER TABLE fragments ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('chinese', content)) STORED;

-- 2. 创建全文搜索 GIN 索引
CREATE INDEX IF NOT EXISTS idx_fragments_search ON fragments USING GIN(search_vector);

-- 3. 创建故事标题搜索索引
CREATE INDEX IF NOT EXISTS idx_stories_title_search ON stories USING GIN(to_tsvector('chinese', title));

-- 4. 创建标签名称搜索索引  
CREATE INDEX IF NOT EXISTS idx_tags_name_search ON tags USING GIN(to_tsvector('chinese', name));

-- 5. 创建搜索函数
CREATE OR REPLACE FUNCTION search_fragments(
  p_user_id UUID,
  p_query TEXT,
  p_story_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  story_id UUID,
  user_id UUID,
  sort_order INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.content,
    f.story_id,
    f.user_id,
    f.sort_order,
    f.created_at,
    f.updated_at,
    ts_rank(f.search_vector, plainto_tsquery('chinese', p_query)) AS rank
  FROM fragments f
  WHERE f.user_id = p_user_id
    AND (
      f.search_vector @@ plainto_tsquery('chinese', p_query)
      OR f.content ILIKE '%' || p_query || '%'
    )
    AND (p_story_id IS NULL OR f.story_id = p_story_id)
  ORDER BY rank DESC, f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION search_fragments IS '全文搜索用户的灵感碎片';

-- 6. 为现有数据生成搜索向量（如果添加字段时数据已存在）
-- UPDATE fragments SET search_vector = to_tsvector('chinese', content) WHERE search_vector IS NULL;

-- ============================================
-- 回滚脚本（如需回滚，请执行以下命令）
-- ============================================
/*
DROP FUNCTION IF EXISTS search_fragments(UUID, TEXT, UUID, INTEGER, INTEGER);
DROP INDEX IF EXISTS idx_tags_name_search;
DROP INDEX IF EXISTS idx_stories_title_search;
DROP INDEX IF EXISTS idx_fragments_search;
ALTER TABLE fragments DROP COLUMN IF EXISTS search_vector;
*/
