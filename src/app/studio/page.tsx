"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  getFragments,
  getStories,
  getTags,
  deleteFragment,
  deleteFragments,
  addTagToFragment,
  removeTagFromFragment,
} from "@/lib/supabase";
import { Fragment, Story, Tag, AIAnalysisHistory } from "@/types";
import { FragmentCard } from "./components/FragmentCard";
import { AISidebar } from "./components/AISidebar";
import { AIHistoryPanel } from "./components/AIHistoryPanel";
import { UserMenu } from "@/components/UserMenu";

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

type SortOption = "newest" | "oldest" | "random";

export default function StudioPage() {
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAI, setShowAI] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<AIAnalysisHistory | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [selectedStoryId, setSelectedStoryId] = useState<string | "all" | "untagged">("all");
  const [selectedTagId, setSelectedTagId] = useState<string | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | string[] | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [fragmentsData, storiesData, tagsData] = await Promise.all([
        getFragments(),
        getStories(),
        getTags(),
      ]);
      setFragments(fragmentsData);
      setStories(storiesData);
      setTags(tagsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 筛选
  const filteredFragments = useMemo(() => {
    let result = fragments.filter((f) => {
      if (selectedStoryId === "untagged") {
        if (f.story_id) return false;
      } else if (selectedStoryId !== "all") {
        if (f.story_id !== selectedStoryId) return false;
      }
      if (selectedTagId !== "all") {
        const hasTag = f.tags?.some(t => t.id === selectedTagId);
        if (!hasTag) return false;
      }
      return true;
    });

    // 排序
    if (sortBy === "newest") {
      result = [...result].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortBy === "oldest") {
      result = [...result].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sortBy === "random") {
      result = [...result];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
    }

    return result;
  }, [fragments, selectedStoryId, selectedTagId, sortBy]);

  // 响应式列数
  const [columnCount, setColumnCount] = useState(2);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1400) setColumnCount(5);
      else if (w >= 1024) setColumnCount(4);
      else if (w >= 640) setColumnCount(3);
      else setColumnCount(2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // 将卡片轮流分配到各列（真正的瀑布流）
  const masonryColumns = useMemo(() => {
    const cols: Fragment[][] = Array.from({ length: columnCount }, () => []);
    filteredFragments.forEach((fragment, idx) => {
      cols[idx % columnCount].push(fragment);
    });
    return cols;
  }, [filteredFragments, columnCount]);

  // 删除功能
  const handleDelete = async (id: string) => {
    console.log('[handleDelete] Called with id:', id);
    try {
      await deleteFragment(id);
      console.log('[handleDelete] Successfully deleted from DB, updating local state');
      setFragments((prev) => prev.filter((f) => f.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error("[handleDelete] Failed to delete:", error);
      alert("删除失败: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await deleteFragments(Array.from(selectedIds));
      setFragments((prev) => prev.filter((f) => !selectedIds.has(f.id)));
      setSelectedIds(new Set());
      setIsEditMode(false);
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("删除失败");
    }
  };

  // 标签操作
  const handleAddTag = async (fragmentId: string, tagId: string) => {
    try {
      await addTagToFragment(fragmentId, tagId);
      setFragments(prev => prev.map(f => {
        if (f.id === fragmentId) {
          const tag = tags.find(t => t.id === tagId);
          if (tag && !f.tags?.find(t => t.id === tagId)) {
            return { ...f, tags: [...(f.tags || []), tag] };
          }
        }
        return f;
      }));
    } catch (error) {
      console.error("Failed to add tag:", error);
    }
  };

  const handleRemoveTag = async (fragmentId: string, tagId: string) => {
    try {
      await removeTagFromFragment(fragmentId, tagId);
      setFragments(prev => prev.map(f => {
        if (f.id === fragmentId) {
          return { ...f, tags: f.tags?.filter(t => t.id !== tagId) || [] };
        }
        return f;
      }));
    } catch (error) {
      console.error("Failed to remove tag:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <motion.div className="flex items-center gap-3 text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="w-5 h-5 rounded-full border-2 border-muted/30 border-t-foreground" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          加载中...
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 md:p-12 pb-32">
      {/* Header */}
      <motion.div className="max-w-7xl mx-auto mb-8" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={springTransition}>
        <div className="flex items-center justify-between mb-6">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...springTransition, delay: 0.1 }}>
            <h1 className="text-2xl font-medium mb-2">创作工作室</h1>
            <motion.p className="text-muted text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              共 {filteredFragments.length} 个灵感碎片
              {selectedIds.size > 0 && (
                <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="ml-2 text-foreground font-medium">
                  · 已选择 {selectedIds.size} 个
                </motion.span>
              )}
            </motion.p>
          </motion.div>
          
          <div className="flex items-center gap-2">
            {/* 历史记录按钮 */}
            <motion.button
              onClick={() => setShowHistory(true)}
              className="px-4 py-2 rounded-full text-sm bg-border/30 text-muted hover:bg-border/50 transition-colors flex items-center gap-1.5"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              title="查看灵感重组历史"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              历史
            </motion.button>
            
            <motion.button
              onClick={() => {
                setIsEditMode(!isEditMode);
                if (isEditMode) setSelectedIds(new Set());
              }}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${isEditMode ? "bg-foreground text-background" : "bg-border/30 text-muted hover:bg-border/50"}`}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              {isEditMode ? "完成" : "编辑"}
            </motion.button>
            <motion.a href="/" className="text-sm text-muted hover:text-foreground transition-colors px-4 py-2 rounded-full hover:bg-border/50" whileHover={{ scale: 1.05, x: -4 }} whileTap={{ scale: 0.95 }}>
              ← 返回捕捉
            </motion.a>
            
            {/* 用户菜单 */}
            <UserMenu />
          </div>
        </div>

        {/* 故事 Tab 页签 */}
        <motion.div 
          className="mb-2" 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-1 p-1 bg-border/20 rounded-xl overflow-x-auto">
            <div className="flex-1 flex items-center gap-1 overflow-x-auto">
            <motion.button 
              onClick={() => setSelectedStoryId("all")} 
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedStoryId === "all" ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
              whileTap={{ scale: 0.98 }}
            >
              全部碎片
              <span className="ml-1.5 text-xs opacity-60">{fragments.length}</span>
            </motion.button>
            
            <motion.button 
              onClick={() => setSelectedStoryId("untagged")} 
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedStoryId === "untagged" ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
              whileTap={{ scale: 0.98 }}
            >
              未分类
              <span className="ml-1.5 text-xs opacity-60">{fragments.filter(f => !f.story_id).length}</span>
            </motion.button>
            
            {stories.map((story) => {
              const count = fragments.filter(f => f.story_id === story.id).length;
              const isSelected = selectedStoryId === story.id;
              return (
                <motion.button 
                  key={story.id} 
                  onClick={() => setSelectedStoryId(story.id)} 
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${isSelected ? "bg-background shadow-sm" : "text-muted hover:text-foreground"}`}
                  style={{ 
                    color: isSelected ? story.color : undefined,
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: story.color }} 
                  />
                  {story.title}
                  <span className="text-xs opacity-60">{count}</span>
                </motion.button>
              );
            })}
            </div>
            
            {/* 展开/收起按钮 */}
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className="flex-shrink-0 p-2 text-muted hover:text-foreground rounded-lg hover:bg-border/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={showFilters ? "收起筛选" : "展开筛选"}
            >
              <motion.svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                animate={{ rotate: showFilters ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </motion.button>
          </div>
        </motion.div>

        {/* 工具栏：标签筛选 + 排序 */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-border/30 overflow-hidden" 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* 标签筛选 */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted mr-1">标签筛选</span>
                {tags.length === 0 ? (
                  <span className="text-xs text-muted/50">暂无标签</span>
                ) : (
                  <>
                    <motion.button 
                      onClick={() => setSelectedTagId("all")} 
                      className={`px-2.5 py-1 rounded-md text-xs transition-all ${selectedTagId === "all" ? "bg-foreground text-background" : "bg-border/30 text-muted hover:bg-border/50"}`}
                      whileTap={{ scale: 0.95 }}
                    >
                      全部
                    </motion.button>
                    {tags.map((tag) => {
                      const isSelected = selectedTagId === tag.id;
                      return (
                        <motion.button 
                          key={tag.id} 
                          onClick={() => setSelectedTagId(isSelected ? "all" : tag.id)} 
                          className={`px-2.5 py-1 rounded-md text-xs transition-all flex items-center gap-1.5 ${isSelected ? "text-white" : "bg-border/30 text-muted hover:bg-border/50"}`}
                          style={{ backgroundColor: isSelected ? tag.color : undefined }} 
                          whileTap={{ scale: 0.95 }}
                          title={isSelected ? "点击取消筛选" : "点击筛选"}
                        >
                          {isSelected && <span className="text-[10px]">✓</span>}
                          {tag.name}
                        </motion.button>
                      );
                    })}
                  </>
                )}
              </div>

              {/* 排序选项 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">排序</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as SortOption)} 
                  className="px-3 py-1.5 bg-border/30 rounded-lg text-xs text-foreground outline-none hover:bg-border/50 transition-colors cursor-pointer"
                >
                  <option value="newest">最新优先</option>
                  <option value="oldest">最早优先</option>
                  <option value="random">随机排列</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 批量操作栏 */}
        <AnimatePresence>
          {isEditMode && selectedIds.size > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 pt-4 border-t border-border/50">
              <span className="text-sm text-muted">已选择 {selectedIds.size} 个</span>
              <motion.button onClick={() => setShowDeleteConfirm(Array.from(selectedIds))} className="px-4 py-1.5 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                批量删除
              </motion.button>
              <motion.button onClick={() => setSelectedIds(new Set())} className="px-4 py-1.5 text-muted hover:text-foreground rounded-full text-sm transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                取消选择
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 内容区域 */}
        

      </motion.div>

      {/* 瀑布流布局 - JS 分列实现 */}
      <div className="max-w-7xl mx-auto w-full flex gap-4 sm:gap-5">
        {masonryColumns.map((col, colIdx) => (
          <div key={colIdx} className="flex-1 min-w-0 flex flex-col gap-4">
            {col.map((fragment) => (
              <FragmentCard
                key={fragment.id}
                fragment={fragment}
                formattedDate={formatDate(fragment.created_at)}
                isSelected={selectedIds.has(fragment.id)}
                onToggle={() => toggleSelection(fragment.id)}
                onDelete={() => setShowDeleteConfirm(fragment.id)}
                onAddTag={(tagId) => handleAddTag(fragment.id, tagId)}
                onRemoveTag={(tagId) => handleRemoveTag(fragment.id, tagId)}
                onTagClick={(tagId) => setSelectedTagId(prev => prev === tagId ? "all" : tagId)}
                onCreateTag={async (name) => {
                  try {
                    const { createTag } = await import("@/lib/supabase");
                    const newTag = await createTag(name);
                    setTags(prev => [...prev, newTag]);
                    return newTag;
                  } catch (error) {
                    console.error("Failed to create tag:", error);
                    return null;
                  }
                }}
                availableTags={tags}
                index={colIdx}
                showTopDelete={isEditMode}
                isMasonry={true}
              />
            ))}
          </div>
        ))}
      </div>

      {/* 空状态 */}
      <AnimatePresence>
        {filteredFragments.length === 0 && (
          <motion.div className="max-w-7xl mx-auto text-center py-20" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            <motion.div className="w-24 h-24 bg-border/30 rounded-full flex items-center justify-center mx-auto mb-6" animate={{ scale: [1, 1.05] }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}>
              <span className="text-4xl opacity-50">···</span>
            </motion.div>
            <p className="text-muted mb-4">
              {selectedStoryId === "untagged" ? "没有无标签的灵感碎片" : selectedStoryId === "all" ? "还没有灵感碎片" : "这个故事还没有灵感碎片"}
            </p>
            <motion.a href="/" className="inline-block text-foreground underline underline-offset-4 hover:text-muted transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              去捕捉灵感 →
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>



      {/* AI 按钮 */}
      {!isEditMode && (
        <AnimatePresence>
          {filteredFragments.length > 0 && (
            <motion.button
              onClick={() => setShowAI(true)}
              disabled={selectedIds.size === 0}
              className="fixed bottom-6 right-6 w-14 h-14 bg-foreground text-background rounded-full flex items-center justify-center shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.2 }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.8 }}
            >
              <motion.svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" animate={selectedIds.size > 0 ? { rotate: [0, 15] } : {}} transition={{ duration: 0.25, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </motion.svg>
              <AnimatePresence>
                {selectedIds.size > 0 && (
                  <motion.div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-3 py-1 rounded-full whitespace-nowrap pointer-events-none" initial={{ opacity: 0, y: 10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.8 }}>
                    点击重组
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </AnimatePresence>
      )}

      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteConfirm(null)} />
            <motion.div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-2xl p-6 shadow-xl z-50 w-full max-w-sm" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}>
              <h3 className="text-lg font-medium mb-2">确认删除</h3>
              <p className="text-muted text-sm mb-6">
                {Array.isArray(showDeleteConfirm) ? `确定要删除选中的 ${showDeleteConfirm.length} 个灵感碎片吗？此操作无法撤销。` : "确定要删除这个灵感碎片吗？此操作无法撤销。"}
              </p>
              <div className="flex gap-3 justify-end">
                <motion.button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-muted hover:text-foreground rounded-lg text-sm transition-colors" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>取消</motion.button>
                <motion.button onClick={() => { 
                  console.log('[DeleteConfirm] Clicked, showDeleteConfirm:', showDeleteConfirm);
                  if (Array.isArray(showDeleteConfirm)) { 
                    handleBatchDelete(); 
                  } else if (typeof showDeleteConfirm === 'string') { 
                    handleDelete(showDeleteConfirm); 
                  } else {
                    console.error('[DeleteConfirm] Invalid showDeleteConfirm:', showDeleteConfirm);
                  }
                  setShowDeleteConfirm(null); 
                }} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>删除</motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI Sidebar */}
      <AnimatePresence>
        {showAI && (
          <AISidebar 
            isOpen={showAI} 
            onClose={() => {
              setShowAI(false);
              setSelectedHistory(null);
            }} 
            selectedFragments={filteredFragments.filter((f) => selectedIds.has(f.id))}
            initialHistory={selectedHistory}
            onHistorySaved={() => setHistoryRefreshKey(prev => prev + 1)}
          />
        )}
      </AnimatePresence>

      {/* AI History Panel */}
      <AIHistoryPanel 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)}
        onSelectHistory={(history) => {
          setSelectedHistory(history);
          setShowHistory(false);
          setShowAI(true);
        }}
        key={historyRefreshKey}
      />

    </main>
  );
}
