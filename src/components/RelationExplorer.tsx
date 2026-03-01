"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Network, 
  Lightbulb, 
  Group, 
  Clock, 
  Tag,
  Sparkles,
  Loader2,
  X,
  Check,
  Trash2
} from "lucide-react";
import { Fragment } from "@/types";
import { 
  RelationAnalysisResult, 
  RelationSuggestion,
  getRelationSuggestions,
  acceptRelationSuggestion,
  rejectRelationSuggestion,
  saveRelationSuggestions
} from "@/lib/supabase";
import { RelationGraph } from "./RelationGraph";
import { RelationSuggestions } from "./RelationSuggestions";
import { SmartGroups } from "./SmartGroups";
import { TimelineView } from "./TimelineView";
import { ThemeClusters } from "./ThemeClusters";

type ViewMode = "graph" | "suggestions" | "groups" | "timeline" | "themes";

interface RelationExplorerProps {
  fragments: Fragment[];
  isOpen: boolean;
  onClose: () => void;
}

export function RelationExplorer({ fragments, isOpen, onClose }: RelationExplorerProps) {
  const [activeView, setActiveView] = useState<ViewMode>("suggestions");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<RelationAnalysisResult | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [streamContent, setStreamContent] = useState("");

  // 获取待处理推荐数量
  useEffect(() => {
    if (isOpen) {
      fetchPendingCount();
    }
  }, [isOpen]);

  const fetchPendingCount = async () => {
    try {
      const { total_pending } = await getRelationSuggestions(1);
      setPendingCount(total_pending);
    } catch (error: any) {
      // 401 表示未登录，这是正常的，静默处理
      if (error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
        setPendingCount(0);
        return;
      }
      console.error("Failed to fetch pending count:", error);
    }
  };

  // AI 分析关联
  const analyzeRelations = useCallback(async () => {
    if (fragments.length < 2) {
      alert("需要至少 2 个灵感碎片才能分析关联");
      return;
    }

    setIsAnalyzing(true);
    setStreamContent("");
    setActiveView("suggestions");

    try {
      const response = await fetch("/api/relations/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fragment_ids: fragments.map(f => f.id),
          analysis_depth: "deep"
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert("请先登录后再使用 AI 关联分析功能");
          setIsAnalyzing(false);
          return;
        }
        throw new Error("Analysis failed");
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("f:")) continue;

            if (trimmed.startsWith("0:")) {
              try {
                const data = trimmed.slice(2);
                const decoded = JSON.parse(data);
                fullText += decoded;
                setStreamContent(fullText);
              } catch {
                const data = trimmed.slice(2).replace(/^"|"$/g, "");
                const decoded = data.replace(/\\n/g, "\n").replace(/\\"/g, '"');
                fullText += decoded;
                setStreamContent(fullText);
              }
            }
          }
        }
      }

      // 解析 JSON
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result: RelationAnalysisResult = JSON.parse(jsonMatch[0]);
        setAnalysisResult(result);

        // 保存推荐到数据库
        if (result.suggestions.length > 0) {
          await saveRelationSuggestions(result.suggestions.map(s => ({
            source_fragment_id: s.source_fragment_id,
            target_fragment_id: s.target_fragment_id,
            relation_type: s.relation_type,
            confidence: s.confidence,
            reason: s.reason
          })));
        }

        await fetchPendingCount();
      }

    } catch (error) {
      console.error("Analysis error:", error);
      alert("分析失败，请重试");
    } finally {
      setIsAnalyzing(false);
    }
  }, [fragments]);

  const handleAcceptSuggestion = async (suggestionId: string) => {
    try {
      await acceptRelationSuggestion(suggestionId);
      await fetchPendingCount();
      // 刷新推荐列表
      if (activeView === "suggestions") {
        // 触发刷新
      }
    } catch (error) {
      console.error("Accept error:", error);
    }
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    try {
      await rejectRelationSuggestion(suggestionId);
      await fetchPendingCount();
    } catch (error) {
      console.error("Reject error:", error);
    }
  };

  const views = [
    { id: "suggestions" as ViewMode, label: "推荐", icon: Lightbulb, badge: pendingCount },
    { id: "graph" as ViewMode, label: "图谱", icon: Network },
    { id: "groups" as ViewMode, label: "分组", icon: Group },
    { id: "timeline" as ViewMode, label: "时间线", icon: Clock },
    { id: "themes" as ViewMode, label: "主题", icon: Tag },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Main Panel */}
      <motion.div
        initial={{ x: "100%", opacity: 0.8 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0.8 }}
        className="fixed right-0 top-0 h-full w-full max-w-4xl bg-background border-l border-border z-50 
                   flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium">灵感关联探索</h2>
            <motion.button
              onClick={analyzeRelations}
              disabled={isAnalyzing || fragments.length < 2}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-full 
                       text-sm font-medium disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI 分析关联
                </>
              )}
            </motion.button>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-border">
          {views.map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                        ${activeView === view.id 
                          ? "border-foreground text-foreground" 
                          : "border-transparent text-muted hover:text-foreground"}`}
            >
              <view.icon className="w-4 h-4" />
              {view.label}
              {view.badge ? (
                <span className="ml-1 px-1.5 py-0.5 bg-foreground text-background text-xs rounded-full">
                  {view.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {isAnalyzing && streamContent && !analysisResult ? (
              <motion.div
                key="streaming"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full p-6 overflow-auto"
              >
                <div className="flex items-center gap-2 text-muted mb-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI 正在分析碎片关联...
                </div>
                <pre className="text-sm whitespace-pre-wrap font-mono text-muted">
                  {streamContent}
                </pre>
              </motion.div>
            ) : (
              <>
                {activeView === "suggestions" && (
                  <RelationSuggestions
                    suggestions={analysisResult?.suggestions || []}
                    onAccept={handleAcceptSuggestion}
                    onReject={handleRejectSuggestion}
                  />
                )}
                {activeView === "graph" && (
                  <RelationGraph
                    relations={analysisResult?.relations || []}
                    fragments={fragments}
                  />
                )}
                {activeView === "groups" && (
                  <SmartGroups
                    groups={analysisResult?.groups || []}
                    fragments={fragments}
                  />
                )}
                {activeView === "timeline" && (
                  <TimelineView
                    timeline={analysisResult?.timeline}
                    fragments={fragments}
                  />
                )}
                {activeView === "themes" && (
                  <ThemeClusters
                    themes={analysisResult?.themes || []}
                    fragments={fragments}
                  />
                )}
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border text-xs text-muted">
          共 {fragments.length} 个碎片 · AI 分析由通义千问提供
        </div>
      </motion.div>
    </>
  );
}
