"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2 } from "lucide-react";
import { searchFragments, getSearchSuggestions, SearchResult, SearchSuggestions } from "@/lib/supabase";
import { Fragment, Story, Tag } from "@/types";

interface SearchBarProps {
  onSearchResults?: (results: SearchResult) => void;
  onClearSearch?: () => void;
  selectedStoryId?: string | "all" | "untagged";
  className?: string;
}

export function SearchBar({ 
  onSearchResults, 
  onClearSearch,
  selectedStoryId,
  className = ""
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({ stories: [], tags: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 获取搜索建议
  const fetchSuggestions = useCallback(async (value: string) => {
    if (value.length < 1) {
      setSuggestions({ stories: [], tags: [] });
      return;
    }
    
    try {
      const data = await getSearchSuggestions(value);
      setSuggestions(data);
    } catch {
      setSuggestions({ stories: [], tags: [] });
    }
  }, []);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
    setHasSearched(false);
    
    // 清除之前的 debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce 获取建议
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 150);
  };

  // 执行搜索
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      handleClear();
      return;
    }
    
    setIsSearching(true);
    setShowSuggestions(false);
    setHasSearched(true);
    
    try {
      const storyId = selectedStoryId && selectedStoryId !== "all" && selectedStoryId !== "untagged" 
        ? selectedStoryId 
        : undefined;
      
      const results = await searchFragments(searchQuery, { storyId });
      onSearchResults?.(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, [selectedStoryId, onSearchResults]);

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  // 清除搜索
  const handleClear = () => {
    setQuery("");
    setSuggestions({ stories: [], tags: [] });
    setShowSuggestions(false);
    setHasSearched(false);
    onClearSearch?.();
    inputRef.current?.focus();
  };

  // 点击建议项
  const handleSuggestionClick = (type: "story" | "tag", item: Story | Tag) => {
    if (type === "story") {
      setQuery(`story:"${(item as Story).title}" `);
    } else {
      setQuery(`tag:"${(item as Tag).name}" `);
    }
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".search-container")) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K 聚焦搜索
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Esc 清除搜索
      if (e.key === "Escape" && query) {
        handleClear();
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [query]);

  return (
    <div className={`search-container relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          {/* 搜索图标 */}
          <Search className="absolute left-3 w-4 h-4 text-muted pointer-events-none" />
          
          {/* 输入框 */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.length > 0 && setShowSuggestions(true)}
            placeholder="搜索灵感..."
            className="w-full pl-9 pr-20 py-2 bg-border/20 border border-border/50 rounded-xl 
                       text-sm placeholder:text-muted/50
                       focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30
                       transition-all"
          />
          
          {/* 右侧按钮组 */}
          <div className="absolute right-2 flex items-center gap-1">
            {/* 清除按钮 */}
            <AnimatePresence>
              {query && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleClear}
                  className="p-1 rounded-md hover:bg-border/50 text-muted hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
            
            {/* 加载状态 */}
            {isSearching && (
              <Loader2 className="w-4 h-4 text-muted animate-spin" />
            )}
            
            {/* 快捷键提示 */}
            {!query && !isSearching && (
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] text-muted bg-border/50 rounded">
                ⌘K
              </kbd>
            )}
          </div>
        </div>
      </form>

      {/* 搜索建议下拉框 */}
      <AnimatePresence>
        {showSuggestions && (suggestions.stories.length > 0 || suggestions.tags.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 py-2 bg-background border border-border/50 
                       rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            {/* 故事建议 */}
            {suggestions.stories.length > 0 && (
              <div className="px-2 pb-2">
                <div className="px-2 py-1 text-xs text-muted uppercase tracking-wider">
                  故事
                </div>
                {suggestions.stories.map((story) => (
                  <button
                    key={story.id}
                    onClick={() => handleSuggestionClick("story", story as Story)}
                    className="w-full px-2 py-1.5 flex items-center gap-2 rounded-lg 
                               hover:bg-border/30 text-left text-sm transition-colors"
                  >
                    <span 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: story.color }} 
                    />
                    <span className="truncate">{story.title}</span>
                  </button>
                ))}
              </div>
            )}
            
            {/* 标签建议 */}
            {suggestions.tags.length > 0 && (
              <div className="px-2 pt-2 border-t border-border/30">
                <div className="px-2 py-1 text-xs text-muted uppercase tracking-wider">
                  标签
                </div>
                {suggestions.tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleSuggestionClick("tag", tag as Tag)}
                    className="w-full px-2 py-1.5 flex items-center gap-2 rounded-lg 
                               hover:bg-border/30 text-left text-sm transition-colors"
                  >
                    <span 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: tag.color }} 
                    />
                    <span className="truncate">{tag.name}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 搜索结果统计 */}
      <AnimatePresence>
        {hasSearched && !isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-xs text-muted"
          >
            搜索 &quot;{query}&quot;
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
