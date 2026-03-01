-- ============================================
-- 迁移: 008_add_fragment_relations
-- 描述: 添加碎片关联功能
-- 日期: 2026-03-01
-- ============================================

-- 1. 创建关联类型枚举
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'relation_type') THEN
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
  END IF;
END $$;

-- 2. 创建碎片关联表
CREATE TABLE IF NOT EXISTS fragment_relations (
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
    -- 确保不会创建重复的关联（A->B 和 B->A 被视为不同）
    UNIQUE(source_fragment_id, target_fragment_id, relation_type)
);

COMMENT ON TABLE fragment_relations IS '碎片之间的关联关系';
COMMENT ON COLUMN fragment_relations.relation_type IS '关联类型：相似、对比、顺序、因果等';
COMMENT ON COLUMN fragment_relations.strength IS '关联强度，0-1之间';
COMMENT ON COLUMN fragment_relations.ai_generated IS '是否由AI生成';

-- 3. 创建关联推荐表（存储AI推荐但未确认的关联）
CREATE TABLE IF NOT EXISTS fragment_relation_suggestions (
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
COMMENT ON COLUMN fragment_relation_suggestions.status IS '状态：pending待处理, accepted已接受, rejected已拒绝';

-- 4. 创建索引
CREATE INDEX idx_relations_source ON fragment_relations(source_fragment_id);
CREATE INDEX idx_relations_target ON fragment_relations(target_fragment_id);
CREATE INDEX idx_relations_user ON fragment_relations(user_id);
CREATE INDEX idx_relations_type ON fragment_relations(relation_type);
CREATE INDEX idx_relations_ai ON fragment_relations(ai_generated) WHERE ai_generated = true;

CREATE INDEX idx_suggestions_user ON fragment_relation_suggestions(user_id);
CREATE INDEX idx_suggestions_status ON fragment_relation_suggestions(status);
CREATE INDEX idx_suggestions_pending ON fragment_relation_suggestions(user_id, status) WHERE status = 'pending';

-- 5. 启用 RLS
ALTER TABLE fragment_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragment_relation_suggestions ENABLE ROW LEVEL SECURITY;

-- 6. 创建 RLS 策略
CREATE POLICY "Users can CRUD their own relations"
    ON fragment_relations FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can CRUD their own suggestions"
    ON fragment_relation_suggestions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 7. 创建触发器更新 updated_at
CREATE OR REPLACE FUNCTION update_relations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fragment_relations_updated_at
    BEFORE UPDATE ON fragment_relations
    FOR EACH ROW EXECUTE FUNCTION update_relations_updated_at();

CREATE TRIGGER update_suggestions_updated_at
    BEFORE UPDATE ON fragment_relation_suggestions
    FOR EACH ROW EXECUTE FUNCTION update_relations_updated_at();

-- 8. 创建函数：接受推荐并创建正式关联
CREATE OR REPLACE FUNCTION accept_relation_suggestion(p_suggestion_id UUID)
RETURNS UUID AS $$
DECLARE
    v_relation_id UUID;
    v_suggestion RECORD;
BEGIN
    -- 获取推荐信息
    SELECT * INTO v_suggestion
    FROM fragment_relation_suggestions
    WHERE id = p_suggestion_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Suggestion not found or already processed';
    END IF;
    
    -- 创建正式关联
    INSERT INTO fragment_relations (
        source_fragment_id,
        target_fragment_id,
        relation_type,
        strength,
        ai_generated,
        ai_confidence,
        user_id
    ) VALUES (
        v_suggestion.source_fragment_id,
        v_suggestion.target_fragment_id,
        v_suggestion.relation_type,
        v_suggestion.confidence,
        true,
        v_suggestion.confidence,
        v_suggestion.user_id
    )
    ON CONFLICT (source_fragment_id, target_fragment_id, relation_type) 
    DO UPDATE SET 
        strength = EXCLUDED.strength,
        ai_generated = EXCLUDED.ai_generated,
        ai_confidence = EXCLUDED.ai_confidence,
        updated_at = NOW()
    RETURNING id INTO v_relation_id;
    
    -- 更新推荐状态
    UPDATE fragment_relation_suggestions
    SET status = 'accepted'
    WHERE id = p_suggestion_id;
    
    RETURN v_relation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 创建函数：获取关联图谱数据
CREATE OR REPLACE FUNCTION get_relation_graph(p_user_id UUID, p_fragment_ids UUID[] DEFAULT NULL)
RETURNS TABLE (
    node_id UUID,
    node_content TEXT,
    edge_source UUID,
    edge_target UUID,
    edge_type relation_type,
    edge_strength DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as node_id,
        f.content as node_content,
        r.source_fragment_id as edge_source,
        r.target_fragment_id as edge_target,
        r.relation_type as edge_type,
        r.strength as edge_strength
    FROM fragment_relations r
    JOIN fragments f ON f.id = r.source_fragment_id OR f.id = r.target_fragment_id
    WHERE r.user_id = p_user_id
      AND (p_fragment_ids IS NULL OR r.source_fragment_id = ANY(p_fragment_ids) OR r.target_fragment_id = ANY(p_fragment_ids));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION accept_relation_suggestion IS '接受关联推荐并创建正式关联';
COMMENT ON FUNCTION get_relation_graph IS '获取关联图谱数据';

-- ============================================
-- 回滚脚本
-- ============================================
/*
DROP FUNCTION IF EXISTS get_relation_graph(UUID, UUID[]);
DROP FUNCTION IF EXISTS accept_relation_suggestion(UUID);
DROP TABLE IF EXISTS fragment_relation_suggestions;
DROP TABLE IF EXISTS fragment_relations;
DROP TYPE IF EXISTS relation_type;
*/
