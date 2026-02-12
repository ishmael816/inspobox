-- 插入示例故事
INSERT INTO stories (title, description, color) VALUES
  ('时间循环之谜', '关于时间倒流和记忆的故事线', '#3b82f6'),
  ('都市传说集', '城市里的神秘事件和传说', '#8b5cf6'),
  ('雨夜书店', '那个神秘书店的系列故事', '#10b981'),
  ('未完成', '还没有归属的灵感', '#6b7280');

-- 将现有碎片关联到故事（可选）
-- UPDATE fragments SET story_id = (SELECT id FROM stories WHERE title = '时间循环之谜') 
-- WHERE content LIKE '%时间%' OR content LIKE '%倒流%';
