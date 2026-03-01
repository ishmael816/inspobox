"use client";

import { motion } from "framer-motion";
import { Check, X, Sparkles, Lightbulb } from "lucide-react";
import { RelationSuggestion } from "@/lib/supabase";

interface RelationSuggestionsProps {
  suggestions: RelationSuggestion[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

const relationTypeLabels: Record<string, { label: string; color: string }> = {
  similar: { label: "相似", color: "#3b82f6" },
  contrast: { label: "对比", color: "#f59e0b" },
  sequence: { label: "顺序", color: "#10b981" },
  causal: { label: "因果", color: "#ef4444" },
  thematic: { label: "主题", color: "#8b5cf6" },
  emotional: { label: "情感", color: "#ec4899" },
  reference: { label: "引用", color: "#6b7280" },
};

export function RelationSuggestions({ 
  suggestions, 
  onAccept, 
  onReject 
}: RelationSuggestionsProps) {
  if (suggestions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted p-8">
        <Lightbulb className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-center">
          暂无关联推荐<br />
          <span className="text-sm">点击上方"AI 分析关联"开始探索</span>
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted">
        <Sparkles className="w-4 h-4" />
        AI 发现了 {suggestions.length} 个可能的关联
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const typeInfo = relationTypeLabels[suggestion.relation_type] || 
                          { label: suggestion.relation_type, color: "#6b7280" };

          return (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-foreground/5 rounded-xl p-4 border border-border/50"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: typeInfo.color }}
                  >
                    {typeInfo.label}
                  </span>
                  <span className="text-xs text-muted">
                    置信度 {Math.round(suggestion.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-1 h-full min-h-[40px] bg-foreground/10 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm line-clamp-2">{suggestion.source_preview}</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="w-px h-4 bg-border" />
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-1 h-full min-h-[40px] bg-foreground/10 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm line-clamp-2">{suggestion.target_preview}</p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              {suggestion.reason && (
                <p className="text-xs text-muted bg-background rounded-lg p-2 mb-3">
                  💡 {suggestion.reason}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <motion.button
                  onClick={() => onAccept(suggestion.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 
                           text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Check className="w-4 h-4" />
                  确认关联
                </motion.button>
                <motion.button
                  onClick={() => onReject(suggestion.id)}
                  className="px-4 py-2 hover:bg-foreground/5 text-muted hover:text-foreground 
                           rounded-lg text-sm transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
