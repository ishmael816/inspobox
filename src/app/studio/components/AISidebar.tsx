"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, Transition } from "framer-motion";
import { Fragment, AIAnalysisResult, AIAnalysisHistory } from "@/types";
import { createAIHistory } from "@/lib/supabase";

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFragments: Fragment[];
  initialHistory?: AIAnalysisHistory | null;
  onHistorySaved?: () => void;
}

const springTransition: Transition = {
  type: "spring",
  stiffness: 350,
  damping: 30,
};

const bounceTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 20,
};

export function AISidebar({ 
  isOpen, 
  onClose, 
  selectedFragments,
  initialHistory,
  onHistorySaved 
}: AISidebarProps) {
  const [result, setResult] = useState<AIAnalysisResult | null>(initialHistory?.result || null);
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState(initialHistory?.raw_text || "");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasSaved, setHasSaved] = useState(!!initialHistory);

  const handleAnalyze = useCallback(async () => {
    if (selectedFragments.length === 0) return;
    
    setLoading(true);
    setIsStreaming(true);
    setStreamingText("");
    setResult(null);
    
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fragments: selectedFragments,
          targetFragment: selectedFragments[0],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          // Vercel AI SDK 格式: "0:" 开头表示文本数据
          if (trimmedLine.startsWith("0:")) {
            try {
              // 提取数据：去掉 "0:" 前缀
              const data = trimmedLine.slice(2);
              // 解析 JSON 字符串（去除外层引号并转义）
              const decoded = JSON.parse(data);
              fullText += decoded;
              setStreamingText(fullText);
            } catch (e) {
              // 如果解析失败，尝试直接提取
              const data = trimmedLine.slice(2).replace(/^"|"$/g, "");
              const decoded = data
                .replace(/\\n/g, "\n")
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, "\\");
              fullText += decoded;
              setStreamingText(fullText);
            }
          }
          // 错误格式: "3:" 开头
          else if (trimmedLine.startsWith("3:")) {
            try {
              const errorData = trimmedLine.slice(2);
              const errorMsg = JSON.parse(errorData);
              console.error("Stream error:", errorMsg);
            } catch (e) {
              // 忽略解析错误
            }
          }
          // 其他格式，直接累积
          else if (!trimmedLine.startsWith("f:")) {
            fullText += trimmedLine;
            setStreamingText(fullText);
          }
        }
      }

      // 流结束，尝试解析 JSON
      if (fullText.trim()) {
        try {
          // 清理文本，去除可能的前缀和后缀
          let cleanText = fullText.trim();
          
          // 去除可能的 markdown 代码块标记
          const jsonMatch = cleanText.match(/```json\s*([\s\S]*?)\s*```/) || 
                            cleanText.match(/```\s*([\s\S]*?)\s*```/);
          
          if (jsonMatch) {
            cleanText = jsonMatch[1].trim();
          }
          
          // 尝试找到 JSON 对象的开始和结束
          const startIdx = cleanText.indexOf('{');
          const endIdx = cleanText.lastIndexOf('}');
          
          if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
            const jsonStr = cleanText.slice(startIdx, endIdx + 1);
            const parsed: AIAnalysisResult = JSON.parse(jsonStr);
            setResult(parsed);
            
            // 保存到历史记录
            if (!hasSaved && selectedFragments.length > 0) {
              try {
                await createAIHistory(
                  selectedFragments.map(f => f.id),
                  parsed,
                  fullText,
                  selectedFragments[0].id
                );
                setHasSaved(true);
                onHistorySaved?.();
              } catch (saveError) {
                console.error("Failed to save history:", saveError);
              }
            }
          } else {
            console.log("未找到有效的 JSON 对象，显示原始内容");
            // 不设置 result，让界面显示流式文本
          }
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.log("原始文本:", fullText);
          // 不阻断用户，让流式文本保持显示
          
          // 即使解析失败，也保存原始文本到历史记录
          if (!hasSaved && selectedFragments.length > 0) {
            try {
              await createAIHistory(
                selectedFragments.map(f => f.id),
                { groups: [], suggestions: [] },
                fullText,
                selectedFragments[0].id
              );
              setHasSaved(true);
              onHistorySaved?.();
            } catch (saveError) {
              console.error("Failed to save history:", saveError);
            }
          }
        }
      }

    } catch (error) {
      console.error("AI analysis failed:", error);
      const errorMsg = error instanceof Error ? error.message : "未知错误";
      alert(`分析失败: ${errorMsg}`);
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  }, [selectedFragments]);

  // 从流式文本中提取并渲染结构化内容
  const renderStreamingContent = () => {
    if (!streamingText) return null;
    
    return (
      <div className="space-y-6">
        {/* 显示正在接收的实时文本 */}
        <motion.div 
          className="p-4 bg-foreground/5 rounded-xl border border-foreground/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center gap-2 text-xs text-muted mb-3">
            <motion.span 
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            AI 正在思考...
          </div>
          
          {/* 完整流式内容 */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap font-mono max-h-[300px] overflow-y-auto">
            {streamingText}
            {isStreaming && (
              <motion.span
                className="inline-block w-0.5 h-4 bg-foreground ml-1 align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </div>
        </motion.div>
      </div>
    );
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
      
      {/* Sidebar */}
      <motion.div 
        className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border z-50 flex flex-col"
        initial={{ x: "100%", opacity: 0.8 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0.8 }}
        transition={springTransition}
      >
        {/* Header */}
        <motion.div 
          className="p-6 border-b border-border flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 30, delay: 0.1 }}
        >
          <div>
            <motion.h2 
              className="text-lg font-medium"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              灵感重组
            </motion.h2>
            <motion.p 
              className="text-sm text-muted mt-1"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              已选择 {selectedFragments.length} 个碎片
            </motion.p>
          </div>
          <motion.button
            onClick={onClose}
            className="p-2 hover:bg-border rounded-xl transition-colors"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </motion.div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {!result && !loading && !isStreaming && (
              <motion.div 
                key="empty"
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={springTransition}
              >
                <motion.div 
                  className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6"
                  animate={{ 
                    scale: [1, 1.05],
                    rotate: [0, 5]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                >
                  <motion.svg 
                    className="w-10 h-10 text-muted" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </motion.svg>
                </motion.div>
                <motion.p 
                  className="text-muted mb-8"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  AI 将分析选中的碎片，寻找关联并提供创作建议
                </motion.p>
                <motion.button
                  onClick={handleAnalyze}
                  className="relative px-8 py-3 bg-foreground text-background rounded-full font-medium overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={bounceTransition}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="relative z-10">开始分析</span>
                </motion.button>
              </motion.div>
            )}

            {(loading || isStreaming) && !result && (
              <motion.div 
                key="streaming"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {renderStreamingContent()}
              </motion.div>
            )}

            {result && (
              <motion.div 
                key="result"
                className="space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
              >
                {/* Groups */}
                <section>
                  <motion.h3 
                    className="text-sm font-medium text-muted mb-4 uppercase tracking-wider"
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                  >
                    关联分组
                  </motion.h3>
                  <div className="space-y-3">
                    {result.groups.map((group, idx) => (
                      <motion.div 
                        key={idx} 
                        className="p-4 bg-gradient-to-r from-border/30 to-transparent rounded-xl border border-border/30"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1, type: "spring", stiffness: 350, damping: 30 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                      >
                        <div className="font-medium mb-1">{group.label}</div>
                        <div className="text-sm text-muted">
                          包含 {group.fragmentIds.length} 个碎片
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* Suggestions */}
                <section>
                  <motion.h3 
                    className="text-sm font-medium text-muted mb-4 uppercase tracking-wider"
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    发展建议
                  </motion.h3>
                  <div className="space-y-3">
                    {result.suggestions.map((suggestion, idx) => (
                      <motion.div 
                        key={idx} 
                        className="p-4 border border-border/50 rounded-xl hover:border-foreground/30 hover:bg-foreground/[0.02] transition-all cursor-pointer group"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 + idx * 0.1, type: "spring", stiffness: 350, damping: 30 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start gap-3">
                          <motion.span 
                            className="text-muted text-sm font-medium"
                            whileHover={{ scale: 1.2, rotate: 10 }}
                          >
                            {idx + 1}.
                          </motion.span>
                          <p className="flex-1 leading-relaxed">{suggestion}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* Regenerate */}
                <motion.button
                  onClick={handleAnalyze}
                  className="w-full py-4 text-muted hover:text-foreground transition-colors text-sm rounded-xl hover:bg-border/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="inline-flex items-center gap-2"
                  >
                    重新分析
                  </motion.span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
