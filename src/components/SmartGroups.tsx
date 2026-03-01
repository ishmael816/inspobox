"use client";

import { motion } from "framer-motion";
import { FolderOpen, Sparkles } from "lucide-react";
import { Fragment } from "@/types";
import { SmartGroup } from "@/lib/supabase";

interface SmartGroupsProps {
  groups: SmartGroup[];
  fragments: Fragment[];
}

export function SmartGroups({ groups, fragments }: SmartGroupsProps) {
  if (groups.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted p-8">
        <FolderOpen className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-center">
          暂无智能分组<br />
          <span className="text-sm">点击上方"AI 分析关联"生成分组</span>
        </p>
      </div>
    );
  }

  const getFragmentCount = (group: SmartGroup) => {
    return group.fragment_ids?.length || 0;
  };

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted">
        <Sparkles className="w-4 h-4" />
        AI 发现了 {groups.length} 个潜在分组
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-foreground/5 rounded-xl p-4 border border-border/50 hover:border-foreground/20 
                     transition-colors group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: group.color || "#171717" }}
                >
                  {group.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium">{group.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>{getFragmentCount(group)} 个碎片</span>
                    <span>·</span>
                    <span>置信度 {Math.round(group.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {group.description && (
              <p className="text-sm text-muted mb-3">{group.description}</p>
            )}

            {/* Tags */}
            {group.tags && group.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {group.tags.map(tag => (
                  <span 
                    key={tag}
                    className="px-2 py-0.5 bg-background rounded text-xs text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Key Themes */}
            {group.key_themes && group.key_themes.length > 0 && (
              <div className="pt-3 border-t border-border/30">
                <div className="text-xs text-muted mb-1.5">关键主题</div>
                <div className="flex flex-wrap gap-1.5">
                  {group.key_themes.map(theme => (
                    <span 
                      key={theme}
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{ 
                        backgroundColor: `${group.color}20`,
                        color: group.color 
                      }}
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fragments Preview */}
            <div className="mt-3 pt-3 border-t border-border/30">
              <div className="text-xs text-muted mb-2">包含碎片</div>
              <div className="space-y-1.5">
                {group.fragment_ids?.slice(0, 3).map(id => {
                  const fragment = fragments.find(f => f.id === id);
                  if (!fragment) return null;
                  return (
                    <div 
                      key={id}
                      className="text-xs text-muted bg-background rounded px-2 py-1.5 line-clamp-1"
                    >
                      {fragment.content}
                    </div>
                  );
                })}
                {(group.fragment_ids?.length || 0) > 3 && (
                  <div className="text-xs text-muted text-center">
                    还有 {group.fragment_ids!.length - 3} 个...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
