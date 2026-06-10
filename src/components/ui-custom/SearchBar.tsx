/**
 * Apple-style Global Search Bar
 * Glassmorphism, rounded 12px, backdrop-filter: blur(20px)
 */
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface SearchBarProps {
  onSearch: (company: string, businessLine: string) => void;
  isLoading: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim() || isLoading) return;

      // Parse "company-business_line" format
      const parts = query.split('-').map((s) => s.trim());
      const company = parts[0];
      const businessLine = parts.length > 1 ? parts.slice(1).join('-') : undefined;

      onSearch(company, businessLine || '');
    },
    [query, isLoading, onSearch]
  );

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="relative w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="apple-glass rounded-[12px] border border-white/20 shadow-lg">
        <div className="flex items-center px-4 py-3">
          {/* Search Icon */}
          <svg
            className="w-5 h-5 text-[#86868B] mr-3 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入公司名-业务线（如：字节跳动-抖音）"
            className="flex-1 bg-transparent outline-none text-[15px] text-[#1D1D1F] placeholder-[#86868B]"
            disabled={isLoading}
          />

          {isLoading && (
            <motion.div
              className="w-4 h-4 border-2 border-[#0071E3] border-t-transparent rounded-full ml-2"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {!isLoading && query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="ml-2 text-[#86868B] hover:text-[#1D1D1F] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="ml-3 apple-btn disabled:opacity-40 disabled:cursor-not-allowed"
          >
            搜索
          </button>
        </div>
      </div>

      <p className="text-[11px] text-[#86868B] mt-2 text-center">
        格式：公司名-业务线（业务线可选）
      </p>
    </motion.form>
  );
}
