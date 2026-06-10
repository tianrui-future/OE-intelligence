/**
 * Executive Flow Panel - Bottom Section
 * Horizontal card flow with status labels, source links, filters
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ExecutiveFlow, FlowStatus } from '@/types';
import { FLOW_STATUS_CONFIG } from '@/types';
import { CredibilityBadge } from './CredibilityBadge';
import { SourceLink } from './SourceLink';

interface ExecutiveFlowPanelProps {
  flows: ExecutiveFlow[];
}

type FilterType = 'all' | 'inflow' | 'outflow';

export function ExecutiveFlowPanel({ flows }: ExecutiveFlowPanelProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<FlowStatus | 'all'>('all');

  const filtered = useMemo(() => {
    let result = [...flows];
    if (filter !== 'all') {
      result = result.filter((f) => f.flow_type === filter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((f) => f.status === statusFilter);
    }
    // Sort by date descending
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [flows, filter, statusFilter]);

  if (flows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-[#86868B]">
        <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-xs">暂无高管流动数据</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with filters */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
          高管流动
          <span className="ml-1.5 text-[10px] font-normal text-[#86868B]">({filtered.length})</span>
        </h3>
        <div className="flex items-center gap-2">
          {/* Flow type filter */}
          <div className="flex bg-[#F5F5F7] rounded-lg p-0.5">
            {([
              { key: 'all', label: '全部' },
              { key: 'inflow', label: '流入' },
              { key: 'outflow', label: '流出' },
            ] as { key: FilterType; label: string }[]).map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-200 ${
                  filter === item.key
                    ? 'bg-white text-[#1D1D1F] shadow-sm'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-1.5 mb-3 px-1">
        {([
          { key: 'all', label: '全部状态' },
          { key: 'confirmed', label: '已确认' },
          { key: 'pending', label: '待核实' },
          { key: 'rumor', label: '传闻' },
        ] as { key: FlowStatus | 'all'; label: string }[]).map((item) => (
          <button
            key={item.key}
            onClick={() => setStatusFilter(item.key as FlowStatus | 'all')}
            className={`px-2 py-0.5 text-[10px] rounded-full transition-all duration-200 ${
              statusFilter === item.key
                ? 'bg-[#0071E3] text-white'
                : 'bg-[#F5F5F7] text-[#86868B] hover:bg-[#E5E5EA]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="apple-scroll overflow-x-auto flex-1">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-24 text-[#86868B] text-xs"
            >
              没有符合条件的数据
            </motion.div>
          ) : (
            <div className="flex gap-3 pb-1">
              {filtered.map((flow, idx) => (
                <motion.div
                  key={flow.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.03, duration: 0.25 }}
                  className="apple-card p-3 min-w-[240px] max-w-[280px] flex-shrink-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                        style={{
                          backgroundColor:
                            flow.flow_type === 'inflow' ? '#34C759' : '#FF3B30',
                        }}
                      >
                        {flow.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#1D1D1F]">{flow.name}</p>
                        <p className="text-[11px] text-[#86868B]">{flow.title}</p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: FLOW_STATUS_CONFIG[flow.status].bg,
                        color: FLOW_STATUS_CONFIG[flow.status].color,
                      }}
                    >
                      {FLOW_STATUS_CONFIG[flow.status].label}
                    </span>
                  </div>

                  {/* Flow direction */}
                  <div className="flex items-center gap-1.5 text-[12px] mb-2">
                    <span className="text-[#86868B] truncate max-w-[80px]">
                      {flow.from_company || '外部'}
                    </span>
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: flow.flow_type === 'inflow' ? '#34C759' : '#FF3B30' }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={
                          flow.flow_type === 'inflow'
                            ? 'M17 8l4 4m0 0l-4 4m4-4H3'
                            : 'M7 16l-4-4m0 0l4-4m-4 4h18'
                        }
                      />
                    </svg>
                    <span className="text-[#1D1D1F] font-medium truncate max-w-[80px]">
                      {flow.to_company || '外部'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#86868B]">{flow.date}</span>
                    <CredibilityBadge level={flow.metadata.credibility} showLabel size="sm" />
                  </div>
                  <SourceLink url={flow.metadata.source_url} updateTime={flow.metadata.update_time} />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
