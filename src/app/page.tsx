"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { createFragment, getStories, createStory, getTags, createTag } from "@/lib/supabase";
import { Story, Tag } from "@/types";
import { UserMenu } from "@/components/UserMenu";

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
  mass: 0.8,
};

const STORY_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", 
  "#ef4444", "#ec4899", "#06b6d4", "#171717"
];

const TAG_COLORS = [
  "#6b7280", "#3b82f6", "#10b981", "#f59e0b", 
  "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"
];

export default function Home() {
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flyingText, setFlyingText] = useState<string | null>(null);
  
  // 故事相关
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStoryColor, setNewStoryColor] = useState(STORY_COLORS[0]);
  
  // 标签相关
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [showTagInput, setShowTagInput] = useState(false);
  
  const controls = useAnimation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storiesData, tagsData] = await Promise.all([
        getStories(),
        getTags(),
      ]);
      setStories(storiesData);
      setTags(tagsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isSubmitting) return;

    const textToSend = input.trim();
    setIsSubmitting(true);
    setFlyingText(textToSend);
    setInput("");

    await controls.start("flying");
    
    try {
      await createFragment(
        textToSend, 
        selectedStory?.id, 
        selectedTags.map(t => t.id)
      );
      
      setTimeout(() => {
        setFlyingText(null);
        setIsSubmitting(false);
        setSelectedStory(null);
        setSelectedTags([]);
        setShowTagInput(false);
        controls.set("initial");
      }, 1200);
    } catch (error) {
      console.error("Failed to save:", error);
      alert("保存失败");
      setFlyingText(null);
      setIsSubmitting(false);
      controls.set("initial");
    }
  }, [input, isSubmitting, selectedStory, selectedTags, controls]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isCreatingStory && !isCreatingTag) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleTag = (tag: Tag) => {
    setSelectedTags(prev => {
      const exists = prev.find(t => t.id === tag.id);
      if (exists) {
        return prev.filter(t => t.id !== tag.id);
      }
      return [...prev, tag];
    });
  };

  const handleCreateStory = async () => {
    if (!newStoryTitle.trim()) return;
    try {
      const newStory = await createStory(newStoryTitle.trim(), undefined, newStoryColor);
      setStories([newStory, ...stories]);
      setSelectedStory(newStory);
      setIsCreatingStory(false);
      setNewStoryTitle("");
    } catch (error) {
      console.error("Failed to create story:", error);
      alert("创建故事失败");
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const newTag = await createTag(newTagName.trim(), newTagColor);
      setTags([...tags, newTag]);
      setSelectedTags([...selectedTags, newTag]);
      setIsCreatingTag(false);
      setNewTagName("");
    } catch (error) {
      console.error("Failed to create tag:", error);
      alert("创建标签失败，可能已存在同名标签");
    }
  };

  const charCount = input.length;
  const hasInput = input.trim().length > 0;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* 背景装饰 */}
      <motion.div className="absolute inset-0 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-foreground/[0.02]"
            style={{ width: 300 + i * 200, height: 300 + i * 200, left: "50%", top: "50%" }}
            animate={{ x: ["-50%", "-48%"], y: ["-50%", "-52%"], scale: [1, 1.05] }}
            transition={{ duration: 4 + i, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />
        ))}
      </motion.div>

      {/* 飞出动画 */}
      <AnimatePresence>
        {flyingText && (
          <motion.div
            className="fixed z-50 pointer-events-none"
            initial={{ opacity: 1, scale: 1, y: 0 }}
            animate={{ opacity: 0, scale: 0.6, y: -300 }}
            transition={{ type: "spring", stiffness: 500, damping: 15, duration: 0.6 }}
            style={{ left: "50%", top: "50%", x: "-50%", y: "-50%" }}
          >
            <div 
              className="px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-white"
              style={{ backgroundColor: selectedStory?.color || '#171717' }}
            >
              {selectedTags.length > 0 && (
                <div className="flex gap-1">
                  {selectedTags.slice(0, 3).map(tag => (
                    <span key={tag.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                  ))}
                </div>
              )}
              <span className="text-sm font-medium max-w-[200px] truncate">{flyingText}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主输入区域 */}
      <motion.div className="w-full max-w-2xl relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* 输入框 */}
        <motion.div className="relative" whileTap={{ scale: 0.995 }}>
          <motion.textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="捕捉你的灵感..."
            disabled={isSubmitting}
            className="w-full bg-transparent text-2xl md:text-3xl text-foreground placeholder:text-muted/40 resize-none outline-none text-center leading-relaxed disabled:opacity-30 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-3xl py-8 px-6"
            rows={3}
            autoFocus
            animate={controls}
            variants={{ initial: { scale: 1 }, flying: { scale: 0.95, transition: { duration: 0.3 } } }}
            whileFocus={{ scale: 1.02, transition: springTransition }}
          />
        </motion.div>

        {/* 扩展面板 - 故事和标签 */}
        <AnimatePresence>
          {hasInput && !isSubmitting && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-2xl p-4 border border-border/50 space-y-4">
                
                {/* 故事选择 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted uppercase tracking-wider">归属故事</span>
                    {selectedStory && (
                      <button onClick={() => setSelectedStory(null)} className="text-xs text-muted hover:text-foreground">
                        清除
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      onClick={() => setSelectedStory(null)}
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        selectedStory === null ? "bg-foreground text-background" : "bg-border/50 text-muted hover:bg-border"
                      }`}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    >
                      无
                    </motion.button>
                    {stories.map(story => (
                      <motion.button
                        key={story.id}
                        onClick={() => setSelectedStory(story)}
                        className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 ${
                          selectedStory?.id === story.id ? "text-white" : "bg-border/50 text-muted hover:bg-border"
                        }`}
                        style={{ backgroundColor: selectedStory?.id === story.id ? story.color : undefined }}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: story.color }} />
                        {story.title}
                      </motion.button>
                    ))}
                    <motion.button
                      onClick={() => setIsCreatingStory(true)}
                      className="px-3 py-1.5 rounded-full text-sm border border-dashed border-muted text-muted hover:border-foreground hover:text-foreground"
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    >
                      ＋ 新故事
                    </motion.button>
                  </div>
                  
                  {/* 新建故事输入 */}
                  <AnimatePresence>
                    {isCreatingStory && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 pt-3 border-t border-border/50">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newStoryTitle}
                            onChange={(e) => setNewStoryTitle(e.target.value)}
                            placeholder="故事名称..."
                            className="flex-1 px-3 py-2 bg-background rounded-lg text-sm outline-none border border-border focus:border-foreground"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === "Enter") handleCreateStory(); if (e.key === "Escape") setIsCreatingStory(false); }}
                          />
                        </div>
                        <div className="flex gap-2 mb-2">
                          {STORY_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => setNewStoryColor(color)}
                              className={`w-5 h-5 rounded-full ${newStoryColor === color ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleCreateStory} disabled={!newStoryTitle.trim()} className="px-4 py-1.5 bg-foreground text-background rounded-lg text-sm disabled:opacity-30">创建</button>
                          <button onClick={() => { setIsCreatingStory(false); setNewStoryTitle(""); }} className="px-4 py-1.5 text-muted hover:text-foreground rounded-lg text-sm">取消</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 标签选择 */}
                <div className="pt-3 border-t border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted uppercase tracking-wider">标签</span>
                    <div className="flex gap-2">
                      {selectedTags.length > 0 && (
                        <button onClick={() => setSelectedTags([])} className="text-xs text-muted hover:text-foreground">
                          清除全部
                        </button>
                      )}
                      <button onClick={() => setShowTagInput(!showTagInput)} className="text-xs text-foreground hover:text-muted">
                        {showTagInput ? "收起" : "管理"}
                      </button>
                    </div>
                  </div>
                  
                  {/* 已选标签展示 */}
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedTags.map(tag => (
                        <motion.button
                          key={tag.id}
                          onClick={() => toggleTag(tag)}
                          className="px-2 py-1 rounded-md text-xs text-white flex items-center gap-1"
                          style={{ backgroundColor: tag.color }}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        >
                          {tag.name}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </motion.button>
                      ))}
                    </div>
                  )}
                  
                  {/* 标签输入区域 */}
                  <AnimatePresence>
                    {showTagInput && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {tags.filter(t => !selectedTags.find(st => st.id === t.id)).map(tag => (
                            <motion.button
                              key={tag.id}
                              onClick={() => toggleTag(tag)}
                              className="px-2 py-1 rounded-md text-xs border transition-colors"
                              style={{ borderColor: tag.color, color: tag.color }}
                              whileHover={{ scale: 1.05, backgroundColor: `${tag.color}15` }} whileTap={{ scale: 0.95 }}
                            >
                              + {tag.name}
                            </motion.button>
                          ))}
                          <motion.button
                            onClick={() => setIsCreatingTag(true)}
                            className="px-2 py-1 rounded-md text-xs border border-dashed border-muted text-muted hover:border-foreground hover:text-foreground"
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          >
                            ＋ 新标签
                          </motion.button>
                        </div>
                        
                        {/* 新建标签 */}
                        <AnimatePresence>
                          {isCreatingTag && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="标签名称..."
                                className="px-3 py-1.5 bg-background rounded-lg text-sm outline-none border border-border focus:border-foreground w-32"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === "Enter") handleCreateTag(); if (e.key === "Escape") setIsCreatingTag(false); }}
                              />
                              <div className="flex gap-1">
                                {TAG_COLORS.map(color => (
                                  <button
                                    key={color}
                                    onClick={() => setNewTagColor(color)}
                                    className={`w-4 h-4 rounded-full ${newTagColor === color ? "ring-2 ring-offset-1 ring-foreground" : ""}`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              <button onClick={handleCreateTag} disabled={!newTagName.trim()} className="px-3 py-1.5 bg-foreground text-background rounded-lg text-xs disabled:opacity-30">添加</button>
                              <button onClick={() => { setIsCreatingTag(false); setNewTagName(""); }} className="px-3 py-1.5 text-muted hover:text-foreground rounded-lg text-xs">取消</button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 底部工具栏 */}
        <motion.div className="mt-6 flex items-center justify-center gap-6">
          <span className="text-sm text-muted tabular-nums">{charCount}</span>
          <motion.button
            onClick={handleSubmit}
            disabled={!input.trim() || isSubmitting}
            className="relative px-6 py-2.5 bg-foreground text-background rounded-full font-medium text-sm disabled:opacity-20 overflow-hidden"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
          >
            <span className="relative z-10 flex items-center gap-2">
              {isSubmitting ? "保存中..." : "保存"}
              {(selectedStory || selectedTags.length > 0) && (
                <span className="flex items-center gap-1">
                  {selectedStory && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedStory.color }} />}
                  {selectedTags.length > 0 && <span className="text-xs">+{selectedTags.length}</span>}
                </span>
              )}
            </span>
          </motion.button>
          <span className="text-xs text-muted/50">Enter</span>
        </motion.div>
      </motion.div>

      {/* 隐藏入口 */}
      <motion.a
        href="/studio"
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center text-muted/30 hover:text-muted/60"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.8 }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </motion.a>

      {/* 品牌 */}
      <motion.div className="fixed top-6 left-1/2 -translate-x-1/2 text-xs text-muted/20 tracking-[0.3em] uppercase">
        InspoBox
      </motion.div>

      {/* 用户菜单 */}
      <motion.div 
        className="fixed top-6 right-6 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <UserMenu />
      </motion.div>

      {/* 成功提示 */}
      <AnimatePresence>
        {flyingText && (
          <motion.div
            className="fixed top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium text-white z-50"
            style={{ backgroundColor: selectedStory?.color || '#22c55e' }}
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            已保存{selectedStory ? `到「${selectedStory.title}」` : ''}
            {selectedTags.length > 0 && ` · ${selectedTags.length}个标签`}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
