-- ============================================
-- 数据库结构检查脚本
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- 1. 检查所有必需的表是否存在
SELECT 
    'fragments' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fragments') as exists
UNION ALL
SELECT 'stories', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stories')
UNION ALL
SELECT 'tags', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tags')
UNION ALL
SELECT 'fragment_tags', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fragment_tags')
UNION ALL
SELECT 'ai_analysis_history', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_analysis_history')
UNION ALL
SELECT 'fragment_relations', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fragment_relations')
UNION ALL
SELECT 'fragment_relation_suggestions', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fragment_relation_suggestions');

-- 2. 检查关键列是否存在（用户隔离相关）
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('fragments', 'stories', 'tags', 'fragment_relations', 'fragment_relation_suggestions')
    AND column_name = 'user_id'
ORDER BY table_name;

-- 3. 检查 RLS 是否启用
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('fragments', 'stories', 'tags', 'fragment_tags', 'ai_analysis_history', 'fragment_relations', 'fragment_relation_suggestions');

-- 4. 检查扩展是否安装
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm');

-- 5. 检查关联功能相关类型和函数
SELECT typname as type_name FROM pg_type WHERE typname = 'relation_type';

SELECT proname as function_name 
FROM pg_proc 
WHERE proname IN ('accept_relation_suggestion', 'get_relation_graph');
