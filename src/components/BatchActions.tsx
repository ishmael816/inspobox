"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderOpen, 
  Tag, 
  Trash2, 
  X,
  Check,
  Loader2,
  ChevronDown
} from "lucide-react";
import { Story, Tag as TagType } from "@/types";
import { 
  batchMoveToStory, 
  batchAddTags, 
  batchRemoveTags,
  deleteFragments 
} from "@/lib/supabase";

interface BatchActionsProps {
  selectedIds: Set<string>;
  stories: Story[];
  tags: TagType[];
  onClearSelection: () => void;
  onActionComplete: () => void;
}

type ActionType = "move" | "addTags" | "removeTags" | "delete" | null;

export function BatchActions({
  selectedIds,
  stories,
  tags,
  onClearSelection,
  onActionComplete
}: BatchActionsProps) {
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | "">("");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleMoveToStory = useCallback(async () => {
    if (!selectedStoryId && selectedStoryId !== "") return;
    
    setLoading(true);
    try {
      await batchMoveToStory(
        Array.from(selectedIds),
        selectedStoryId === "none" ? null : selectedStoryId
      );
      onActionComplete();
      setActiveAction(null);
      setSelectedStoryId("");
    } catch (error) {
      console.error("Batch move error:", error);
      alert("移动失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [selectedIds, selectedStoryId, onActionComplete]);

  const handleAddTags = useCallback(async () => {
    if (selectedTagIds.size === 0) return;
    
    setLoading(true);
    try {
      await batchAddTags(Array.from(selectedIds), Array.from(selectedTagIds));
      onActionComplete();
      setActiveAction(null);
      setSelectedTagIds(new Set());
    } catch (error) {
      console.error("Batch add tags error:", error);
      alert("添加标签失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [selectedIds, selectedTagIds, onActionComplete]);

  const handleRemoveTags = useCallback(async () => {
    if (selectedTagIds.size === 0) return;
    
    setLoading(true);
    try {
      await batchRemoveTags(Array.from(selectedIds), Array.from(selectedTagIds));
      onActionComplete();
      setActiveAction(null);
      setSelectedTagIds(new Set());
    } catch (error) {
      console.error("Batch remove tags error:", error);
      alert("移除标签失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [selectedIds, selectedTagIds, onActionComplete]);

  const handleDelete = useCallback(async () => {
    setLoading(true);
    try {
      await deleteFragments(Array.from(selectedIds));
      onActionComplete();
      setShowDeleteConfirm(false);
      setActiveAction(null);
    } catch (error) {
      console.error("Batch delete error:", error);
      alert("删除失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [selectedIds, onActionComplete]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  if (selectedIds.size === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
      >
        <div className="bg-background border border-border/50 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-2">
          {/* 选择计数 */}
          <div className="px-3 py-1.5 bg-foreground/5 rounded-lg">
            <span className="text-sm font-medium">已选择 {selectedIds.size} 个</span>
          </div>

          <div className="w-px h-8 bg-border/50" />

          {/* 移动到故事 */}
          <div className="relative">
            <motion.button
              onClick={() => setActiveAction(activeAction === "move" ? null : "move")}
              className={`p-2.5 rounded-xl transition-colors flex items-center gap-2 ${
                activeAction === "move" 
                  ? "bg-blue-500/10 text-blue-600" 
                  : "hover:bg-foreground/5 text-muted hover:text-foreground"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="移动到故事"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">移动</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${activeAction === "move" ? "rotate-180" : ""}`} />
            </motion.button>

            <AnimatePresence>
              {activeAction === "move" && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-0 mb-2 w-56 bg-background border border-border/50 
                           rounded-xl shadow-xl p-3"
                >
                  <div className="text-xs text-muted mb-2 px-1">选择目标故事</div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    <button
                      onClick={() => setSelectedStoryId("none")}
                      className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center gap-2 transition-colors ${
                        selectedStoryId === "none" ? "bg-foreground/10" : "hover:bg-foreground/5"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      无故事
                    </button>
                    {stories.map(story => (
                      <button
                        key={story.id}
                        onClick={() => setSelectedStoryId(story.id)}
                        className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center gap-2 transition-colors ${
                          selectedStoryId === story.id ? "bg-foreground/10" : "hover:bg-foreground/5"
                        }`}
                      >
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: story.color }} 
                        />
                        <span className="truncate">{story.title}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/30 flex gap-2">
                    <button
                      onClick={handleMoveToStory}
                      disabled={loading || selectedStoryId === ""}
                      className="flex-1 px-3 py-1.5 bg-foreground text-background rounded-lg text-sm 
                               disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      确认
                    </button>
                    <button
                      onClick={() => { setActiveAction(null); setSelectedStoryId(""); }}
                      className="px-3 py-1.5 hover:bg-foreground/5 rounded-lg text-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 添加标签 */}
          <div className="relative">
            <motion.button
              onClick={() => setActiveAction(activeAction === "addTags" ? null : "addTags")}
              className={`p-2.5 rounded-xl transition-colors flex items-center gap-2 ${
                activeAction === "addTags" 
                  ? "bg-green-500/10 text-green-600" 
                  : "hover:bg-foreground/5 text-muted hover:text-foreground"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="添加标签"
            >
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">加标签</span>
            </motion.button>

            <AnimatePresence>
              {activeAction === "addTags" && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-0 mb-2 w-64 bg-background border border-border/50 
                           rounded-xl shadow-xl p-3"
                >
                  <div className="text-xs text-muted mb-2 px-1">选择要添加的标签</div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                          selectedTagIds.has(tag.id) 
                            ? "text-white" 
                            : "bg-border/30 text-muted hover:bg-border/50"
                        }`}
                        style={{ 
                          backgroundColor: selectedTagIds.has(tag.id) ? tag.color : undefined 
                        }}
                      >
                        {selectedTagIds.has(tag.id) && <Check className="w-3 h-3" />}
                        {tag.name}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/30 flex gap-2">
                    <button
                      onClick={handleAddTags}
                      disabled={loading || selectedTagIds.size === 0}
                      className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm 
                               disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      添加
                    </button>
                    <button
                      onClick={() => { setActiveAction(null); setSelectedTagIds(new Set()); }}
                      className="px-3 py-1.5 hover:bg-foreground/5 rounded-lg text-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 移除标签 */}
          <div className="relative">
            <motion.button
              onClick={() => setActiveAction(activeAction === "removeTags" ? null : "removeTags")}
              className={`p-2.5 rounded-xl transition-colors flex items-center gap-2 ${
                activeAction === "removeTags" 
                  ? "bg-orange-500/10 text-orange-600" 
                  : "hover:bg-foreground/5 text-muted hover:text-foreground"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="移除标签"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">移除标签</span>
            </motion.button>

            <AnimatePresence>
              {activeAction === "removeTags" && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-0 mb-2 w-64 bg-background border border-border/50 
                           rounded-xl shadow-xl p-3"
                >
                  <div className="text-xs text-muted mb-2 px-1">选择要移除的标签</div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                          selectedTagIds.has(tag.id) 
                            ? "bg-red-500 text-white" 
                            : "bg-border/30 text-muted hover:bg-border/50"
                        }`}
                      >
                        {selectedTagIds.has(tag.id) && <X className="w-3 h-3" />}
                        {tag.name}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/30 flex gap-2">
                    <button
                      onClick={handleRemoveTags}
                      disabled={loading || selectedTagIds.size === 0}
                      className="flex-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm 
                               disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      移除
                    </button>
                    <button
                      onClick={() => { setActiveAction(null); setSelectedTagIds(new Set()); }}
                      className="px-3 py-1.5 hover:bg-foreground/5 rounded-lg text-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-8 bg-border/50" />

          {/* 删除 */}
          <motion.button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2.5 rounded-xl hover:bg-red-500/10 text-muted hover:text-red-600 transition-colors
                     flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">删除</span>
          </motion.button>

          <div className="w-px h-8 bg-border/50" />

          {/* 取消选择 */}
          <motion.button
            onClick={onClearSelection}
            className="p-2.5 rounded-xl hover:bg-foreground/5 text-muted hover:text-foreground transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="取消选择"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                       bg-background rounded-2xl p-6 shadow-xl z-50 w-full max-w-sm"
            >
              <h3 className="text-lg font-medium mb-2">确认删除</h3>
              <p className="text-muted text-sm mb-6">
                确定要删除选中的 {selectedIds.size} 个灵感碎片吗？此操作无法撤销。
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-muted hover:text-foreground rounded-lg text-sm transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 
                           transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  删除
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
