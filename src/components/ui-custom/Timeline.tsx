/**
 * Left Sidebar Timeline Component
 * Vertical timeline showing org adjustments over last 6 months
 * Hover shows source link, click jumps to original article
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TimelineEvent } from '@/types';
import { EVENT_TYPE_LABELS } from '@/types';
import { CredibilityBadge } from './CredibilityBadge';
import { SourceLink } from './SourceLink';

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[#86868B]">
        <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">暂无时间轴数据</p>
      </div>
    );
  }

  // Sort by date descending
  const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="apple-scroll overflow-y-auto max-h-full pr-1">
      <h3 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-4 px-1">
        近6个月调整节点
      </h3>
      <div className="relative">
        {sorted.map((evt, idx) => {
          const isExpanded = expandedId === evt.id;
          const isLast = idx === sorted.length - 1;

          return (
            <motion.div
              key={evt.id}
              className="relative pl-8 pb-5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3, ease: 'easeOut' }}
            >
              {/* Timeline connector */}
              {!isLast && (
                <div
                  className="absolute left-[15px] top-8 bottom-0 w-[2px]"
                  style={{
                    background: 'linear-gradient(to bottom, #D2D2D7, transparent)',
                  }}
                />
              )}

              {/* Timeline dot */}
              <div
                className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: getEventColor(evt.event_type) }}
              />

              {/* Card */}
              <div
                className="apple-card p-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : evt.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-medium text-[#0071E3]">
                        {evt.date}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${getEventColor(evt.event_type)}15`,
                          color: getEventColor(evt.event_type),
                        }}
                      >
                        {EVENT_TYPE_LABELS[evt.event_type]}
                      </span>
                    </div>
                    <h4 className="text-[13px] font-medium text-[#1D1D1F] leading-tight truncate">
                      {evt.title}
                    </h4>
                  </div>
                  <CredibilityBadge level={evt.metadata.credibility} showLabel={false} size="sm" />
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[12px] text-[#86868B] mt-2 leading-relaxed">
                        {evt.description}
                      </p>
                      {evt.department && (
                        <p className="text-[11px] text-[#0071E3] mt-1">
                          涉及部门：{evt.department}
                        </p>
                      )}
                      <SourceLink
                        url={evt.metadata.source_url}
                        updateTime={evt.metadata.update_time}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isExpanded && (
                  <div className="flex items-center mt-1 text-[11px] text-[#86868B]">
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    点击查看详情
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function getEventColor(type: string): string {
  const colors: Record<string, string> = {
    restructure: '#0071E3',
    appointment: '#34C759',
    resignation: '#FF3B30',
    merge: '#FF9500',
    split: '#AF52DE',
    other: '#8E8E93',
  };
  return colors[type] || '#8E8E93';
}
