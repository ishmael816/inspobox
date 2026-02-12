"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fragment, Tag } from "@/types";

interface FragmentCardProps {
  fragment: Fragment;
  formattedDate: string;
  isSelected: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  onAddTag?: (tagId: string) => void;
  onRemoveTag?: (tagId: string) => void;
  onTagClick?: (tagId: string) => void;
  availableTags?: Tag[];
  onCreateTag?: (name: string) => Promise<Tag | null>;
  index?: number;
  showDelete?: boolean;
  isDragging?: boolean;
  fixedHeight?: boolean;
  isMasonry?: boolean;
  showTopDelete?: boolean;
}

function calculateCardStyle(content: string, fixedHeight: boolean): { fontClass: string; minHeight: number } {
  if (fixedHeight) {
    return {
      fontClass: "text-xs leading-snug",
      minHeight: 160
    };
  }
  
  const charCount = content.length;
  const lineCount = content.split('\n').length;
  
  // 行高减小，与列间距(16px)保持一致
  const baseHeight = 80;
  const lineHeight = 16; // 与列间距一致
  const charPerLine = 22;
  
  const estimatedLines = Math.max(lineCount, Math.ceil(charCount / charPerLine));
  const contentHeight = estimatedLines * lineHeight;
  const minHeight = Math.min(Math.max(baseHeight + contentHeight, 96), 260);
  
  // 字体再小一级，行高紧凑
  if (charCount <= 15 && lineCount <= 2) {
    return { 
      fontClass: "text-base font-medium leading-tight",
      minHeight: 100
    };
  } else if (charCount <= 40 && lineCount <= 3) {
    return { 
      fontClass: "text-sm leading-snug",
      minHeight: 120
    };
  } else if (charCount <= 80) {
    return { 
      fontClass: "text-xs leading-snug",
      minHeight: 140
    };
  }
  return { 
    fontClass: "text-xs leading-tight",
    minHeight
  };
}

export function FragmentCard({
  fragment,
  formattedDate,
  isSelected,
  onToggle,
  onDelete,
  onAddTag,
  onRemoveTag,
  onTagClick,
  availableTags = [],
  onCreateTag,
  index = 0,
  showDelete = false,
  isDragging = false,
  fixedHeight = false,
  isMasonry = false,
  showTopDelete = false,
}: FragmentCardProps) {
  const { fontClass, minHeight } = calculateCardStyle(fragment.content, fixedHeight);
  const fragmentTags = fragment.tags || [];
  const canAddTags = availableTags.filter(at => !fragmentTags.find(ft => ft.id === at.id));
  
  const [showDetail, setShowDetail] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const tagButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showTagMenu) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        tagMenuRef.current && 
        !tagMenuRef.current.contains(target) &&
        tagButtonRef.current &&
        !tagButtonRef.current.contains(target)
      ) {
        setShowTagMenu(false);
        setIsCreatingTag(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTagMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !onCreateTag) return;
    const tag = await onCreateTag(newTagName.trim());
    if (tag) {
      onAddTag?.(tag.id);
    }
    setIsCreatingTag(false);
    setNewTagName("");
  };

  const cardClassName = `
    fragment-card group relative
    rounded-xl cursor-pointer
    flex flex-col items-center justify-center
    p-6
    ${isDragging ? 'opacity-40 scale-[1.02] shadow-2xl' : ''}
    ${isSelected 
      ? "bg-foreground text-background shadow-lg ring-2 ring-foreground ring-offset-2" 
      : "bg-white dark:bg-neutral-900 border border-border/30 hover:border-border/60"
    }
  `;

  // 简洁的卡片内容 - 文字居中显示
  const simpleCardContent = (
    <>
      {/* 文字容器 - 使用 flex 布局确保垂直水平居中 */}
      <div className="flex-1 flex items-center justify-center w-full">
        <p className={`${fontClass} ${isSelected ? "text-background/95" : "text-foreground"} text-center whitespace-pre-wrap`}>
          {fragment.content}
        </p>
      </div>
      
      {/* 右下角选择点 */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`
          absolute bottom-3 right-3
          w-5 h-5 rounded-full flex items-center justify-center
          transition-all duration-200
          ${isSelected 
            ? "bg-background text-foreground shadow-md" 
            : "bg-transparent border-2 border-muted/40 hover:border-muted"
          }
        `}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        title={isSelected ? "点击取消选择" : "点击选择"}
      >
        <AnimatePresence>
          {isSelected && (
            <motion.svg 
              className="w-3 h-3" 
              fill="currentColor" 
              viewBox="0 0 20 20" 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 45 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );

  // 详情弹窗内容
  const detailContent = (
    <div className="p-6">
      {/* 故事标签 */}
      <div className="mb-4">
        {fragment.story ? (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: fragment.story.color }} />
            <span className="text-sm text-muted">{fragment.story.title}</span>
          </div>
        ) : (
          <span className="text-sm text-muted/60">未分类</span>
        )}
      </div>

      {/* 内容 */}
      <p className="text-lg leading-relaxed mb-6 whitespace-pre-wrap">{fragment.content}</p>

      {/* 标签 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {fragmentTags.map(tag => (
          <button
            key={tag.id}
            onClick={() => onTagClick?.(tag.id)}
            className="px-2 py-1 rounded-md text-xs flex items-center gap-1"
            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
          >
            {tag.name}
            {onRemoveTag && (
              <span 
                onClick={(e) => { e.stopPropagation(); onRemoveTag(tag.id); }}
                className="hover:opacity-70"
              >
                ×
              </span>
            )}
          </button>
        ))}
        
        {canAddTags.length > 0 && (
          <div className="relative">
            <button
              ref={tagButtonRef}
              onClick={() => setShowTagMenu(!showTagMenu)}
              className="px-2 py-1 rounded-md text-xs border border-dashed border-muted text-muted hover:border-foreground hover:text-foreground"
            >
              + 标签
            </button>
            
            <AnimatePresence>
              {showTagMenu && (
                <motion.div
                  ref={tagMenuRef}
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute left-0 top-full mt-2 bg-background border border-border rounded-lg shadow-xl p-2 z-50 min-w-[160px]"
                >
                  <div className="flex flex-wrap gap-1 mb-2">
                    {canAddTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          onAddTag?.(tag.id);
                          setShowTagMenu(false);
                        }}
                        className="px-2 py-1 rounded text-xs border"
                        style={{ borderColor: tag.color, color: tag.color }}
                      >
                        + {tag.name}
                      </button>
                    ))}
                  </div>
                  
                  {!isCreatingTag ? (
                    <button
                      onClick={() => setIsCreatingTag(true)}
                      className="w-full px-2 py-1 text-xs text-muted hover:text-foreground border-t border-border pt-1 text-left"
                    >
                      + 新建标签...
                    </button>
                  ) : (
                    <div className="flex gap-1 pt-1 border-t border-border">
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="标签名"
                        className="flex-1 px-2 py-1 text-xs bg-border/30 rounded outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateTag();
                          if (e.key === "Escape") {
                            setIsCreatingTag(false);
                            setNewTagName("");
                          }
                        }}
                      />
                      <button
                        onClick={handleCreateTag}
                        disabled={!newTagName.trim()}
                        className="px-2 py-1 text-xs bg-foreground text-background rounded disabled:opacity-30"
                      >
                        添加
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 日期和删除 */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="text-sm text-muted">{formattedDate}</span>
        
        <div className="flex gap-2">
          {onDelete && (
            <button
              onClick={() => {
                onDelete();
                setShowDetail(false);
              }}
              className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              删除
            </button>
          )}
          <button
            onClick={() => onToggle()}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              isSelected 
                ? "bg-foreground text-background" 
                : "bg-border/30 text-foreground hover:bg-border/50"
            }`}
          >
            {isSelected ? "已选择" : "选择"}
          </button>
        </div>
      </div>
    </div>
  );

  // 瀑布流模式
  if (isMasonry) {
    return (
      <div className="relative group break-inside-avoid">
        {/* 右上角删除按钮 */}
        {(showTopDelete || !isSelected) && onDelete && (
          <motion.button
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className="
              absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full 
              flex items-center justify-center text-xs shadow-sm
              bg-white text-muted hover:bg-red-500 hover:text-white 
              border border-border opacity-0 group-hover:opacity-100
              transition-opacity cursor-pointer
            "
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        )}
        
        <article
          onClick={() => setShowDetail(true)}
          onContextMenu={handleContextMenu}
          style={{ minHeight: `${minHeight}px` }}
          className={cardClassName}
        >
          {simpleCardContent}
        </article>

        {/* 详情弹窗 */}
        <AnimatePresence>
          {showDetail && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
                onClick={() => setShowDetail(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-2xl shadow-xl z-50 w-full max-w-lg max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {detailContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 右键菜单 */}
        <AnimatePresence>
          {contextMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed bg-background border border-border rounded-lg shadow-xl p-2 z-50 min-w-[120px]"
                style={{ left: contextMenu.x, top: contextMenu.y }}
              >
                <button
                  onClick={() => { setShowDetail(true); setContextMenu(null); }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-border/30 rounded transition-colors"
                >
                  查看详情
                </button>
                {onDelete && (
                  <button
                    onClick={() => { onDelete(); setContextMenu(null); }}
                    className="w-full px-3 py-2 text-sm text-left text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    删除
                  </button>
                )}
                <button
                  onClick={() => { onToggle(); setContextMenu(null); }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-border/30 rounded transition-colors"
                >
                  {isSelected ? "取消选择" : "选择"}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 普通/拖拽模式
  return (
    <>
      <motion.article
        layout={isDragging}
        onClick={() => setShowDetail(true)}
        onContextMenu={handleContextMenu}
        style={{ minHeight: `${minHeight}px` }}
        className={`${cardClassName} mb-4`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30, delay: index * 0.015 }}
        whileHover={{ y: -3 }}
      >
        {simpleCardContent}
      </motion.article>

      {/* 详情弹窗 */}
      <AnimatePresence>
        {showDetail && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              onClick={() => setShowDetail(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-2xl shadow-xl z-50 w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {detailContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 右键菜单 */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed bg-background border border-border rounded-lg shadow-xl p-2 z-50 min-w-[120px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button
                onClick={() => { setShowDetail(true); setContextMenu(null); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-border/30 rounded transition-colors"
              >
                查看详情
              </button>
              {onDelete && (
                <button
                  onClick={() => { onDelete(); setContextMenu(null); }}
                  className="w-full px-3 py-2 text-sm text-left text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  删除
                </button>
              )}
              <button
                onClick={() => { onToggle(); setContextMenu(null); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-border/30 rounded transition-colors"
              >
                {isSelected ? "取消选择" : "选择"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
