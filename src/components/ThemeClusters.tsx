"use client";

import { motion } from "framer-motion";
import { Tag, Hash } from "lucide-react";
import { Fragment } from "@/types";
import { ThemeCluster } from "@/lib/supabase";

interface ThemeClustersProps {
  themes: ThemeCluster[];
  fragments: Fragment[];
}

const levelColors = {
  primary: { bg: "#3b82f6", text: "主要" },
  secondary: { bg: "#8b5cf6", text: "次要" },
  tertiary: { bg: "#6b7280", text: "延伸" },
};

export function ThemeClusters({ themes, fragments }: ThemeClustersProps) {
  if (themes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted p-8">
        <Tag className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-center">
          暂无主题数据<br />
          <span className="text-sm">点击上方"AI 分析关联"提取主题</span>
        </p>
      </div>
    );
  }

  // 按层级分组
  const primaryThemes = themes.filter(t => t.level === "primary");
  const secondaryThemes = themes.filter(t => t.level === "secondary");
  const tertiaryThemes = themes.filter(t => t.level === "tertiary");

  return (
    <div className="h-full overflow-auto p-4">
      {/* Primary Themes */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: levelColors.primary.bg }} />
          核心主题
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {primaryThemes.map((theme, index) => (
            <ThemeCard key={theme.id} theme={theme} fragments={fragments} index={index} />
          ))}
        </div>
      </div>

      {/* Secondary Themes */}
      {secondaryThemes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: levelColors.secondary.bg }} />
            次要主题
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {secondaryThemes.map((theme, index) => (
              <ThemeCard key={theme.id} theme={theme} fragments={fragments} index={index} compact />
            ))}
          </div>
        </div>
      )}

      {/* Tertiary Themes */}
      {tertiaryThemes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: levelColors.tertiary.bg }} />
            延伸主题
          </h3>
          <div className="flex flex-wrap gap-2">
            {tertiaryThemes.map(theme => (
              <motion.div
                key={theme.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-3 py-2 bg-foreground/5 rounded-lg text-sm"
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-3 h-3 text-muted" />
                  {theme.name}
                  <span className="text-xs text-muted">({theme.heat_score})</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ThemeCardProps {
  theme: ThemeCluster;
  fragments: Fragment[];
  index: number;
  compact?: boolean;
}

function ThemeCard({ theme, fragments, index, compact }: ThemeCardProps) {
  const levelInfo = levelColors[theme.level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-foreground/5 rounded-xl border border-border/50 overflow-hidden
                ${compact ? 'p-3' : 'p-4'}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: levelInfo.bg }}
        >
          {theme.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium truncate ${compact ? 'text-sm' : ''}`}>{theme.name}</h4>
          {!compact && (
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>{theme.fragment_ids?.length || 0} 个碎片</span>
              <span>·</span>
              <span>热度 {theme.heat_score}</span>
            </div>
          )}
        </div>
      </div>

      {/* Keywords */}
      {theme.keywords && theme.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {theme.keywords.map(keyword => (
            <span 
              key={keyword}
              className="px-2 py-0.5 bg-background rounded text-xs text-muted"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      {/* Fragments Preview */}
      {!compact && theme.fragment_ids && (
        <div className="space-y-1.5">
          {theme.fragment_ids.slice(0, 2).map(id => {
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
          {theme.fragment_ids.length > 2 && (
            <div className="text-xs text-muted text-center">
              还有 {theme.fragment_ids.length - 2} 个...
            </div>
          )}
        </div>
      )}

      {/* Related Themes */}
      {!compact && theme.related_themes && theme.related_themes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <div className="text-xs text-muted mb-1">相关主题</div>
          <div className="flex flex-wrap gap-1">
            {theme.related_themes.map(related => (
              <span 
                key={related}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${levelInfo.bg}20`, color: levelInfo.bg }}
              >
                {related}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
