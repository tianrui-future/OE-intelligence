/**
 * Credibility Badge Component
 * Three-level system: official (blue), authoritative (orange), unverified (gray)
 */
import { CREDIBILITY_CONFIG } from '@/types';
import type { CredibilityLevel } from '@/types';

interface CredibilityBadgeProps {
  level: CredibilityLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function CredibilityBadge({ level, showLabel = true, size = 'sm' }: CredibilityBadgeProps) {
  const config = CREDIBILITY_CONFIG[level];
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses}`}
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
      }}
      title={`可信度: ${config.label}`}
    >
      <span
        className="inline-block rounded-full"
        style={{
          width: size === 'sm' ? 6 : 8,
          height: size === 'sm' ? 6 : 8,
          backgroundColor: config.color,
        }}
      />
      {showLabel && config.label}
    </span>
  );
}
