"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIAnalysisHistory } from "@/types";
import { getAIHistory, deleteAIHistory } from "@/lib/supabase";

interface AIHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHistory: (history: AIAnalysisHistory) => void;
}

export function AIHistoryPanel({ isOpen, onClose, onSelectHistory }: AIHistoryPanelProps) {
  const [history, setHistory] = useState<AIAnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getAIHistory(10);
      setHistory(data);
    } catch {
      // 表可能不存在，静默失败
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setDeletingId(id);
      await deleteAIHistory(id);
      setHistory(prev => prev.filter(h => h.id !== id));
      if (expandedId === id) {
        setExpandedId(null);
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return "刚刚";
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Panel */}
      <motion.div
        className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border z-50 flex flex-col"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">灵感重组历史</h2>
            <p className="text-sm text-muted mt-1">
              共 {history.length} 条记录
            </p>
          </div>
          <motion.button
            onClick={onClose}
            className="p-2 hover:bg-border rounded-xl transition-colors"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                className="w-6 h-6 rounded-full border-2 border-border border-t-foreground"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-border/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-muted text-sm">暂无历史记录</p>
              <p className="text-muted/60 text-xs mt-1">选择灵感碎片并点击右下角按钮开始分析</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item, idx) => {
                const isExpanded = expandedId === item.id;
                const groupCount = item.result?.groups?.length || 0;
                const suggestionCount = item.result?.suggestions?.length || 0;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`
                      border rounded-xl overflow-hidden transition-all
                      ${isExpanded 
                        ? "border-foreground/30 bg-foreground/[0.02]" 
                        : "border-border/50 hover:border-border"
                      }
                    `}
                  >
                    {/* Header - 可点击展开 */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted">{formatDate(item.created_at)}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-border/50 text-muted">
                              {item.fragment_ids.length} 个碎片
                            </span>
                          </div>
                          <p className="text-sm text-foreground truncate">
                            {groupCount > 0 ? item.result.groups[0].label : "未分组"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* 删除按钮 */}
                          <motion.button
                            onClick={(e) => handleDelete(e, item.id)}
                            disabled={deletingId === item.id}
                            className="p-1.5 text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {deletingId === item.id ? (
                              <motion.div
                                className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                              />
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </motion.button>
                          
                          {/* 展开图标 */}
                          <motion.svg
                            className="w-5 h-5 text-muted"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </motion.svg>
                        </div>
                      </div>

                      {/* 简要统计 */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {groupCount} 个分组
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          {suggestionCount} 个建议
                        </span>
                      </div>
                    </button>

                    {/* 展开内容 */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-2 border-t border-border/50">
                            {/* 关联分组 */}
                            {item.result?.groups && item.result.groups.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-xs font-medium text-muted mb-2 uppercase tracking-wider">
                                  关联分组
                                </h4>
                                <div className="space-y-2">
                                  {item.result.groups.map((group, i) => (
                                    <div
                                      key={i}
                                      className="p-2.5 bg-border/30 rounded-lg text-sm"
                                    >
                                      <div className="font-medium mb-0.5">{group.label}</div>
                                      <div className="text-xs text-muted">{group.fragmentIds.length} 个碎片</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 发展建议 */}
                            {item.result?.suggestions && item.result.suggestions.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-xs font-medium text-muted mb-2 uppercase tracking-wider">
                                  发展建议
                                </h4>
                                <div className="space-y-2">
                                  {item.result.suggestions.map((suggestion, i) => (
                                    <div
                                      key={i}
                                      className="p-2.5 bg-border/30 rounded-lg text-sm leading-relaxed"
                                    >
                                      <span className="text-muted mr-1">{i + 1}.</span>
                                      {suggestion}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 查看按钮 */}
                            <motion.button
                              onClick={() => onSelectHistory(item)}
                              className="w-full py-2.5 bg-foreground text-background rounded-lg text-sm font-medium"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              在侧边栏查看完整内容
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
