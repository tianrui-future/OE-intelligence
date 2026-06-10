/**
 * Source Link Component
 * Displays clickable source URL with update time
 */
interface SourceLinkProps {
  url: string;
  updateTime: string;
}

export function SourceLink({ url, updateTime }: SourceLinkProps) {
  const displayUrl = url.length > 50 ? url.substring(0, 50) + '...' : url;

  return (
    <div className="flex items-center gap-2 text-[11px] text-[#86868B] mt-1.5">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 1C3.24 1 1 3.24 1 6s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 9c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="currentColor"/>
        <path d="M6.5 3.5h-1v2.5h-1.5v1h1.5v2.5h1V7h1.5v-1h-1.5V3.5z" fill="currentColor"/>
      </svg>
      <span>更新: {updateTime}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-[#0071E3] hover:underline transition-colors truncate max-w-[200px]"
        title={url}
        onClick={(e) => e.stopPropagation()}
      >
        {displayUrl}
      </a>
    </div>
  );
}
