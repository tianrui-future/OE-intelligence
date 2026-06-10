/**
 * Rumor Isolation Zone
 * Displays unverified information in gray isolated cards
 * Not mixed with main data
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RumorItem } from '@/types';
import { CredibilityBadge } from './CredibilityBadge';

interface RumorZoneProps {
  rumors: RumorItem[];
}

export function RumorZone({ rumors }: RumorZoneProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (rumors.length === 0) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-[#8E8E93] hover:text-[#636366] transition-colors mb-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span className="text-xs font-medium">传闻区（未核实信息隔离）</span>
        <span className="text-[10px] bg-[#E5E5EA] text-[#8E8E93] px-1.5 py-0.5 rounded-full">
          {rumors.length}
        </span>
        <motion.svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {rumors.map((rumor, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rumor-card p-3"
                >
                  <div className="flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 text-[#8E8E93] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#636366] leading-relaxed">
                        {rumor.content}
                      </p>
                      {rumor.date && (
                        <p className="text-[10px] text-[#8E8E93] mt-1">{rumor.date}</p>
                      )}
                      {rumor.metadata && (
                        <div className="mt-1.5">
                          <CredibilityBadge level="unverified" showLabel size="sm" />
                          {rumor.metadata.source_url && (
                            <a
                              href={rumor.metadata.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-[#0071E3] hover:underline ml-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              来源
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
