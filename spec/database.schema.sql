-- ============================================
-- InspoBox Database Schema
-- 规范版本: 1.0.0
-- 数据库: PostgreSQL 15+ (Supabase)
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 故事表 (Stories)
-- ============================================
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL CHECK (LENGTH(TRIM(title)) > 0),
    description VARCHAR(500),
    color CHAR(7) NOT NULL DEFAULT '#171717' CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE stories IS '用户创建的故事/作品';
COMMENT ON COLUMN stories.color IS '故事主题色，十六进制格式';

-- ============================================
-- 2. 标签表 (Tags)
-- ============================================
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL CHECK (LENGTH(TRIM(name)) > 0),
    color CHAR(7) NOT NULL DEFAULT '#6b7280' CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(name, user_id)
);

COMMENT ON TABLE tags IS '用户定义的标签，用于分类灵感';
COMMENT ON COLUMN tags.name IS '同一用户下标签名唯一';

-- ============================================
-- 3. 灵感碎片表 (Fragments)
-- ============================================
CREATE TABLE fragments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL CHECK (LENGTH(TRIM(content)) > 0 AND LENGTH(content) <= 10000),
    story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE fragments IS '灵感碎片，核心的内容单元';
COMMENT ON COLUMN fragments.content IS '灵感内容，最多10000字符';
COMMENT ON COLUMN fragments.sort_order IS '用于自定义排序';

-- ============================================
-- 4. 碎片-标签关联表 (Fragment Tags)
-- ============================================
CREATE TABLE fragment_tags (
    fragment_id UUID NOT NULL REFERENCES fragments(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (fragment_id, tag_id)
);

COMMENT ON TABLE fragment_tags IS '碎片与标签的多对多关系';

-- ============================================
-- 5. AI 分析历史表 (AI Analysis History)
-- ============================================
CREATE TABLE ai_analysis_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fragment_ids UUID[] NOT NULL,
    target_fragment_id UUID REFERENCES fragments(id) ON DELETE SET NULL,
    result JSONB NOT NULL,
    raw_text TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ai_analysis_history IS 'AI 分析历史记录';
COMMENT ON COLUMN ai_analysis_history.result IS 'AI 返回的结构化结果';
COMMENT ON COLUMN ai_analysis_history.raw_text IS 'AI 原始响应文本';

-- ============================================
-- 索引优化
-- ============================================
CREATE INDEX idx_fragments_user_id ON fragments(user_id);
CREATE INDEX idx_fragments_story_id ON fragments(story_id);
CREATE INDEX idx_fragments_created_at ON fragments(created_at DESC);
CREATE INDEX idx_fragments_user_created ON fragments(user_id, created_at DESC);

CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_name ON tags(user_id, name);

CREATE INDEX idx_fragment_tags_tag_id ON fragment_tags(tag_id);
CREATE INDEX idx_fragment_tags_fragment_id ON fragment_tags(fragment_id);

CREATE INDEX idx_ai_history_user_id ON ai_analysis_history(user_id);
CREATE INDEX idx_ai_history_created_at ON ai_analysis_history(created_at DESC);

-- ============================================
-- RLS (Row Level Security) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragment_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_history ENABLE ROW LEVEL SECURITY;

-- Stories RLS
CREATE POLICY "Users can CRUD their own stories"
    ON stories FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Tags RLS
CREATE POLICY "Users can CRUD their own tags"
    ON tags FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Fragments RLS
CREATE POLICY "Users can CRUD their own fragments"
    ON fragments FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Fragment Tags RLS (通过关联的 fragment 控制)
CREATE POLICY "Users can manage tags for their fragments"
    ON fragment_tags FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM fragments f
            WHERE f.id = fragment_tags.fragment_id
            AND f.user_id = auth.uid()
        )
    );

-- AI History RLS
CREATE POLICY "Users can CRUD their own AI history"
    ON ai_analysis_history FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 触发器函数
-- ============================================

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用触发器
CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON stories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fragments_updated_at
    BEFORE UPDATE ON fragments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 视图
-- ============================================

-- 碎片完整信息视图
CREATE VIEW fragment_details AS
SELECT 
    f.*,
    s.title as story_title,
    s.color as story_color,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', t.id,
                'name', t.name,
                'color', t.color
            )
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'::jsonb
    ) as tags
FROM fragments f
LEFT JOIN stories s ON f.story_id = s.id
LEFT JOIN fragment_tags ft ON f.id = ft.fragment_id
LEFT JOIN tags t ON ft.tag_id = t.id
GROUP BY f.id, s.title, s.color;

-- ============================================
-- 数据验证约束
-- ============================================

-- 确保碎片内容不为空（去除空白后）
CREATE OR REPLACE FUNCTION check_fragment_content()
RETURNS TRIGGER AS $$
BEGIN
    IF LENGTH(TRIM(NEW.content)) = 0 THEN
        RAISE EXCEPTION 'Fragment content cannot be empty';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_fragment_content
    BEFORE INSERT OR UPDATE ON fragments
    FOR EACH ROW EXECUTE FUNCTION check_fragment_content();

-- ============================================
-- 全文搜索支持
-- ============================================

-- 添加搜索向量字段（可选，用于高级搜索）
ALTER TABLE fragments ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('chinese', content)) STORED;

-- 创建全文搜索索引
CREATE INDEX IF NOT EXISTS idx_fragments_search ON fragments USING GIN(search_vector);

-- 创建故事标题搜索索引
CREATE INDEX IF NOT EXISTS idx_stories_title_search ON stories USING GIN(to_tsvector('chinese', title));

-- 创建标签名称搜索索引  
CREATE INDEX IF NOT EXISTS idx_tags_name_search ON tags USING GIN(to_tsvector('chinese', name));

-- 搜索函数
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

-- ============================================
-- 8. 碎片关联表 (Fragment Relations)
-- ============================================

-- 关联类型枚举
CREATE TYPE relation_type AS ENUM (
  'similar',      -- 相似主题
  'contrast',     -- 对比/反差
  'sequence',     -- 时间顺序
  'causal',       -- 因果关系
  'thematic',     -- 主题关联
  'emotional',    -- 情感联系
  'reference',    -- 引用/参考
  'custom'        -- 自定义
);

-- 碎片关联表
CREATE TABLE fragment_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_fragment_id UUID NOT NULL REFERENCES fragments(id) ON DELETE CASCADE,
    target_fragment_id UUID NOT NULL REFERENCES fragments(id) ON DELETE CASCADE,
    relation_type relation_type NOT NULL DEFAULT 'similar',
    strength DECIMAL(3,2) CHECK (strength >= 0 AND strength <= 1),
    description TEXT,
    ai_generated BOOLEAN DEFAULT false,
    ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(source_fragment_id, target_fragment_id, relation_type)
);

COMMENT ON TABLE fragment_relations IS '碎片之间的关联关系';

-- 关联推荐表
CREATE TABLE fragment_relation_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_fragment_id UUID NOT NULL REFERENCES fragments(id) ON DELETE CASCADE,
    target_fragment_id UUID NOT NULL REFERENCES fragments(id) ON DELETE CASCADE,
    relation_type relation_type NOT NULL,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(source_fragment_id, target_fragment_id, relation_type)
);

COMMENT ON TABLE fragment_relation_suggestions IS 'AI推荐的关联建议';

-- 索引
CREATE INDEX idx_relations_source ON fragment_relations(source_fragment_id);
CREATE INDEX idx_relations_target ON fragment_relations(target_fragment_id);
CREATE INDEX idx_relations_user ON fragment_relations(user_id);
CREATE INDEX idx_relations_type ON fragment_relations(relation_type);
CREATE INDEX idx_relations_ai ON fragment_relations(ai_generated) WHERE ai_generated = true;

CREATE INDEX idx_suggestions_user ON fragment_relation_suggestions(user_id);
CREATE INDEX idx_suggestions_status ON fragment_relation_suggestions(status);
CREATE INDEX idx_suggestions_pending ON fragment_relation_suggestions(user_id, status) WHERE status = 'pending';

-- RLS
ALTER TABLE fragment_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragment_relation_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own relations"
    ON fragment_relations FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can CRUD their own suggestions"
    ON fragment_relation_suggestions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 触发器
CREATE TRIGGER update_fragment_relations_updated_at
    BEFORE UPDATE ON fragment_relations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suggestions_updated_at
    BEFORE UPDATE ON fragment_relation_suggestions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
