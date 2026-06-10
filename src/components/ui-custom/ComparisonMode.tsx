/**
 * History Comparison Mode
 * Compare two time points: green=new, red=removed, yellow=adjusted
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CHANGE_TYPE_CONFIG } from '@/types';
import type { ChangeType } from '@/types';
import { compareHistory } from '@/services/api';
import { CredibilityBadge } from './CredibilityBadge';

interface ComparisonModeProps {
  company: string;
}

interface DiffNode {
  id: string;
  name: string;
  leader?: string;
  change_type: ChangeType;
  metadata?: {
    source_url: string;
    credibility: string;
    update_time: string;
  };
}

export function ComparisonMode({ company }: ComparisonModeProps) {
  const [dateA, setDateA] = useState('');
  const [dateB, setDateB] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiffNode[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!dateA || !dateB) return;
    setLoading(true);
    setError(null);
    try {
      const data = await compareHistory(company, dateA, dateB);
      setResult(data.diff_nodes || []);
    } catch (err: any) {
      setError(err.message || '对比失败');
    } finally {
      setLoading(false);
    }
  };

  const changeCounts = result
    ? {
        new: result.filter((n) => n.change_type === 'new').length,
        removed: result.filter((n) => n.change_type === 'removed').length,
        adjusted: result.filter((n) => n.change_type === 'adjusted').length,
        unchanged: result.filter((n) => n.change_type === 'unchanged').length,
      }
    : null;

  return (
    <div className="apple-card p-4">
      <h3 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-3">
        历史对比模式
      </h3>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <label className="text-[11px] text-[#86868B] mb-1 block">时间点 A</label>
          <input
            type="month"
            value={dateA}
            onChange={(e) => setDateA(e.target.value)}
            className="apple-input text-sm"
          />
        </div>
        <div className="text-[#86868B] pt-5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div className="flex-1">
          <label className="text-[11px] text-[#86868B] mb-1 block">时间点 B</label>
          <input
            type="month"
            value={dateB}
            onChange={(e) => setDateB(e.target.value)}
            className="apple-input text-sm"
          />
        </div>
        <div className="pt-5">
          <button
            onClick={handleCompare}
            disabled={loading || !dateA || !dateB}
            className="apple-btn disabled:opacity-40"
          >
            {loading ? (
              <motion.div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              '对比'
            )}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        {(['new', 'removed', 'adjusted'] as ChangeType[]).map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CHANGE_TYPE_CONFIG[type].color }}
            />
            <span className="text-[11px] text-[#86868B]">{CHANGE_TYPE_CONFIG[type].label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="text-xs text-[#FF3B30] bg-[#FF3B30]/5 rounded-lg p-3 mb-3">{error}</div>
      )}

      {changeCounts && (
        <div className="flex items-center gap-4 mb-3 p-2 bg-[#F5F5F7] rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-[#34C759]">{changeCounts.new}</div>
            <div className="text-[10px] text-[#86868B]">新建</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-[#FF3B30]">{changeCounts.removed}</div>
            <div className="text-[10px] text-[#86868B]">撤销</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-[#FFCC00]">{changeCounts.adjusted}</div>
            <div className="text-[10px] text-[#86868B]">调整</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-[#8E8E93]">{changeCounts.unchanged}</div>
            <div className="text-[10px] text-[#86868B]">未变</div>
          </div>
        </div>
      )}

      {result && result.length > 0 && (
        <div className="apple-scroll max-h-60 overflow-y-auto">
          <div className="space-y-2">
            {result.map((node, idx) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center justify-between p-2.5 rounded-lg"
                style={{ backgroundColor: CHANGE_TYPE_CONFIG[node.change_type].bg }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: CHANGE_TYPE_CONFIG[node.change_type].color }}
                  />
                  <span className="text-[13px] font-medium text-[#1D1D1F]">{node.name}</span>
                  {node.leader && (
                    <span className="text-[11px] text-[#86868B]">({node.leader})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: CHANGE_TYPE_CONFIG[node.change_type].color + '20',
                      color: CHANGE_TYPE_CONFIG[node.change_type].color,
                    }}
                  >
                    {CHANGE_TYPE_CONFIG[node.change_type].label}
                  </span>
                  {node.metadata && (
                    <CredibilityBadge
                      level={node.metadata.credibility as any}
                      showLabel={false}
                      size="sm"
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {result && result.length === 0 && !loading && (
        <p className="text-xs text-[#86868B] text-center py-4">未检测到架构差异</p>
      )}
    </div>
  );
}
