/**
 * OE Intelligence Hub - Main Application
 * Competitive Company Organizational Intelligence Station
 * Apple Design System + Real-time Kimi API Search
 */
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchOrgIntelligence, checkHealth } from '@/services/api';
import type { SearchResponse, OrgNode } from '@/types';

import { SearchBar } from '@/components/ui-custom/SearchBar';
import { Timeline } from '@/components/ui-custom/Timeline';
import { OrgTree } from '@/components/ui-custom/OrgTree';
import { ExecutiveFlowPanel } from '@/components/ui-custom/ExecutiveFlowPanel';
import { RumorZone } from '@/components/ui-custom/RumorZone';
import { ComparisonMode } from '@/components/ui-custom/ComparisonMode';
import { SkeletonLoader } from '@/components/ui-custom/SkeletonLoader';
import { CredibilityBadge } from '@/components/ui-custom/CredibilityBadge';

function App() {
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<{ status: string; kimi_configured: boolean } | null>(null);
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    checkHealth()
      .then((h) => setHealth(h))
      .catch(() => setHealth({ status: 'error', kimi_configured: false }));
  }, []);

  const handleSearch = useCallback(async (company: string, businessLine: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedNode(null);

    try {
      const data = await searchOrgIntelligence({
        company,
        business_line: businessLine || undefined,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || '搜索失败，请检查后端服务是否运行');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNodeClick = useCallback((node: OrgNode) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-white">
      {/* Top Navigation - Apple Glassmorphism */}
      <nav className="apple-glass sticky top-0 z-50 border-b border-white/20 dark:border-white/5">
        <div className="max-w-[1440px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#0071E3] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-[14px] font-semibold leading-tight">OE Intelligence Hub</h1>
              <p className="text-[10px] text-[#86868B] leading-tight">竞对公司组织效能情报站</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Health indicator */}
            {health && (
              <div className="flex items-center gap-1.5 text-[11px]">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: health.status === 'ok' ? '#34C759' : '#FF3B30',
                  }}
                />
                <span className="text-[#86868B]">
                  {health.kimi_configured ? 'API就绪' : 'API未配置'}
                </span>
              </div>
            )}

            {/* Comparison toggle */}
            {result?.has_data && (
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all ${
                  showComparison
                    ? 'bg-[#0071E3] text-white'
                    : 'bg-[#F5F5F7] text-[#86868B] hover:bg-[#E5E5EA] dark:bg-[#1C1C1E]'
                }`}
              >
                历史对比
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-4 py-6">
        {/* Search Section */}
        <section className="mb-6">
          <SearchBar onSearch={handleSearch} isLoading={loading} />
        </section>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-[#FF3B30]/5 border border-[#FF3B30]/20 text-[#FF3B30] text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Data Message */}
        <AnimatePresence>
          {result && !result.has_data && result.message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-6 rounded-2xl bg-white dark:bg-[#1C1C1E] shadow-sm text-center"
            >
              <svg className="w-12 h-12 mx-auto mb-3 text-[#E5E5EA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[#86868B] text-sm">{result.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(100vh - 280px)' }}>
              <div className="col-span-3">
                <div className="apple-card h-full p-3">
                  <SkeletonLoader type="timeline" />
                </div>
              </div>
              <div className="col-span-9">
                <div className="apple-card h-full p-4">
                  <SkeletonLoader type="tree" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Results Layout */}
        {result?.has_data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Company Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">
                  {result.company}
                  {result.business_line && (
                    <span className="text-[#86868B] font-normal"> - {result.business_line}</span>
                  )}
                </h2>
                <span className="text-[11px] text-[#86868B]">
                  检索于 {new Date(result.query_time).toLocaleString('zh-CN')}
                </span>
              </div>
            </div>

            {/* Comparison Mode */}
            <AnimatePresence>
              {showComparison && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-4 overflow-hidden"
                >
                  <ComparisonMode company={result.company} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Grid: Timeline + OrgTree */}
            <div className="grid grid-cols-12 gap-4 mb-4" style={{ height: 'calc(100vh - 360px)' }}>
              {/* Left: Timeline */}
              <div className="col-span-3">
                <div className="apple-card h-full p-3 overflow-hidden">
                  <Timeline events={result.timeline} />
                </div>
              </div>

              {/* Right: Org Tree */}
              <div className="col-span-9">
                <div className="apple-card h-full p-4 relative overflow-hidden">
                  <OrgTree
                    nodes={result.nodes}
                    edges={result.edges}
                    onNodeClick={handleNodeClick}
                  />

                  {/* Node Detail Popup */}
                  <AnimatePresence>
                    {selectedNode && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute bottom-4 right-4 apple-card p-4 max-w-xs z-10"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-semibold">{selectedNode.name}</h4>
                          <button
                            onClick={() => setSelectedNode(null)}
                            className="text-[#86868B] hover:text-[#1D1D1F]"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {selectedNode.leader && (
                          <p className="text-xs text-[#86868B] mb-1">
                            负责人：{selectedNode.leader}
                            {selectedNode.leader_title && `（${selectedNode.leader_title}）`}
                          </p>
                        )}
                        <p className="text-[11px] text-[#86868B] mb-2">
                          层级：{selectedNode.level}
                        </p>
                        {selectedNode.metadata && (
                          <div className="space-y-1.5">
                            <CredibilityBadge
                              level={selectedNode.metadata.credibility}
                              showLabel
                              size="sm"
                            />
                            <p className="text-[10px] text-[#86868B]">
                              更新于 {selectedNode.metadata.update_time}
                            </p>
                            <a
                              href={selectedNode.metadata.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-[#0071E3] hover:underline block truncate"
                            >
                              查看来源
                            </a>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Bottom: Executive Flow */}
            <div className="apple-card p-4" style={{ height: 220 }}>
              <ExecutiveFlowPanel flows={result.executive_flow} />
            </div>

            {/* Rumor Zone */}
            <RumorZone rumors={result.rumors} />
          </motion.div>
        )}

        {/* Empty State - Before Search */}
        {!result && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#0071E3] to-[#00C7BE] flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">竞对公司组织效能情报站</h2>
            <p className="text-sm text-[#86868B] max-w-md mx-auto mb-8">
              输入公司名称和业务线，实时检索互联网最新组织架构调整、高管变动和部门负责人信息。
              所有数据均来自网络搜索，可追溯原始来源。
            </p>

            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {[
                { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: '架构调整', desc: '组织架构重组、部门合并拆分' },
                { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', title: '高管流动', desc: '人事任命、离职、调入调出' },
                { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', title: '事实溯源', desc: '三级可信度分级、来源可点击' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="apple-card p-4 text-center"
                >
                  <svg className="w-6 h-6 mx-auto mb-2 text-[#0071E3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  <p className="text-xs font-medium">{item.title}</p>
                  <p className="text-[10px] text-[#86868B] mt-1">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default App;
