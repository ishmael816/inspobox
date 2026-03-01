"use client";

import { motion } from "framer-motion";
import { Clock, AlertCircle, ArrowRight } from "lucide-react";
import { Fragment } from "@/types";

interface TimelineEvent {
  fragment_id: string;
  position: number;
  estimated_time?: string;
  narrative_role: 'setup' | 'inciting' | 'rising' | 'climax' | 'falling' | 'resolution';
  connections: { before: string[]; after: string[] };
}

interface TimelineGap {
  after_fragment_id: string;
  before_fragment_id: string;
  description: string;
  suggestion: string;
}

interface TimelineViewProps {
  timeline?: {
    events: TimelineEvent[];
    gaps: TimelineGap[];
  };
  fragments: Fragment[];
}

const narrativeRoles: Record<string, { label: string; color: string }> = {
  setup: { label: "开端", color: "#3b82f6" },
  inciting: { label: "触发", color: "#10b981" },
  rising: { label: "上升", color: "#f59e0b" },
  climax: { label: "高潮", color: "#ef4444" },
  falling: { label: "下降", color: "#8b5cf6" },
  resolution: { label: "结局", color: "#6b7280" },
};

export function TimelineView({ timeline, fragments }: TimelineViewProps) {
  if (!timeline || timeline.events.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted p-8">
        <Clock className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-center">
          暂无时间线数据<br />
          <span className="text-sm">点击上方"AI 分析关联"生成叙事时间线</span>
        </p>
      </div>
    );
  }

  const sortedEvents = [...timeline.events].sort((a, b) => a.position - b.position);

  return (
    <div className="h-full overflow-auto p-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Clock className="w-4 h-4" />
          叙事时间线 · {sortedEvents.length} 个事件
        </div>
        <div className="flex gap-2">
          {Object.entries(narrativeRoles).map(([key, { label, color }]) => (
            <div key={key} className="flex items-center gap-1 text-xs text-muted">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

        {/* Events */}
        <div className="space-y-6">
          {sortedEvents.map((event, index) => {
            const fragment = fragments.find(f => f.id === event.fragment_id);
            if (!fragment) return null;

            const role = narrativeRoles[event.narrative_role];

            return (
              <motion.div
                key={event.fragment_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex items-start gap-4"
              >
                {/* Node */}
                <div 
                  className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center 
                           text-white font-bold text-sm shadow-lg"
                  style={{ backgroundColor: role?.color || "#171717" }}
                >
                  {index + 1}
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span 
                      className="px-2 py-0.5 rounded text-xs text-white"
                      style={{ backgroundColor: role?.color }}
                    >
                      {role?.label}
                    </span>
                    {event.estimated_time && (
                      <span className="text-xs text-muted">
                        {event.estimated_time}
                      </span>
                    )}
                  </div>

                  <div className="bg-foreground/5 rounded-xl p-4 border border-border/50">
                    <p className="text-sm line-clamp-3">{fragment.content}</p>
                  </div>

                  {/* Connections */}
                  {(event.connections.before.length > 0 || event.connections.after.length > 0) && (
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                      {event.connections.before.length > 0 && (
                        <span>承接: {event.connections.before.length} 个</span>
                      )}
                      {event.connections.after.length > 0 && (
                        <span className="flex items-center gap-1">
                          引出 <ArrowRight className="w-3 h-3" /> {event.connections.after.length} 个
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Gaps */}
      {timeline.gaps.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-600 mb-4">
            <AlertCircle className="w-4 h-4" />
            发现 {timeline.gaps.length} 个叙事缺口
          </div>

          <div className="space-y-3">
            {timeline.gaps.map((gap, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 
                         rounded-xl p-4"
              >
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                  {gap.description}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  💡 {gap.suggestion}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
