/**
 * Skeleton Loader Component
 * Apple-style skeleton screen with shimmer effect
 */
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  type?: 'tree' | 'timeline' | 'cards' | 'search';
}

export function SkeletonLoader({ type = 'tree' }: SkeletonLoaderProps) {
  if (type === 'search') {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="apple-glass rounded-[12px] p-4">
          <div className="skeleton h-10 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (type === 'timeline') {
    return (
      <div className="space-y-4 p-2">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-3"
          >
            <div className="skeleton w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-3 w-3/4 rounded" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'cards') {
    return (
      <div className="flex gap-3 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.08 }}
            className="apple-card p-3 min-w-[240px] space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="skeleton w-8 h-8 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <div className="skeleton h-3.5 w-20 rounded" />
                <div className="skeleton h-3 w-28 rounded" />
              </div>
            </div>
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </motion.div>
        ))}
      </div>
    );
  }

  // Tree skeleton
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="skeleton w-24 h-10 rounded-xl" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-8 skeleton" />
        <div className="absolute top-18 left-1/2 -translate-x-1/2 flex gap-12">
          <div className="skeleton w-20 h-9 rounded-lg" />
          <div className="skeleton w-20 h-9 rounded-lg" />
          <div className="skeleton w-20 h-9 rounded-lg" />
        </div>
      </motion.div>
      <p className="text-sm text-[#86868B] animate-pulse">正在检索组织架构数据...</p>
    </div>
  );
}
