/**
 * OE Intelligence Hub - Frontend Type Definitions
 * Mirrors the backend Pydantic models
 */

export type CredibilityLevel = 'official' | 'authoritative' | 'unverified';
export type EventType = 'restructure' | 'appointment' | 'resignation' | 'merge' | 'split' | 'other';
export type FlowType = 'inflow' | 'outflow';
export type FlowStatus = 'confirmed' | 'pending' | 'rumor';
export type ChangeType = 'new' | 'removed' | 'adjusted' | 'unchanged';

export interface SourceMetadata {
  source_url: string;
  credibility: CredibilityLevel;
  update_time: string;
}

export interface OrgNode {
  id: string;
  name: string;
  leader?: string;
  leader_title?: string;
  parent_id?: string | null;
  level: number;
  metadata?: SourceMetadata | null;
  is_rumor: boolean;
  change_type?: ChangeType | null;
  children?: OrgNode[];
  // UI state
  collapsed?: boolean;
}

export interface OrgEdge {
  source: string;
  target: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  department?: string | null;
  event_type: EventType;
  metadata: SourceMetadata;
  is_rumor: boolean;
}

export interface ExecutiveFlow {
  id: string;
  name: string;
  title: string;
  flow_type: FlowType;
  status: FlowStatus;
  from_company?: string | null;
  to_company?: string | null;
  date: string;
  metadata: SourceMetadata;
}

export interface RumorItem {
  type: 'department' | 'event';
  content: string;
  date?: string;
  metadata?: SourceMetadata;
}

export interface SearchRequest {
  company: string;
  business_line?: string;
}

export interface SearchResponse {
  company: string;
  business_line?: string;
  query_time: string;
  nodes: OrgNode[];
  edges: OrgEdge[];
  timeline: TimelineEvent[];
  executive_flow: ExecutiveFlow[];
  has_data: boolean;
  message?: string;
  rumors: RumorItem[];
}

// Credibility badge config
export const CREDIBILITY_CONFIG: Record<CredibilityLevel, { label: string; color: string; bg: string; border: string }> = {
  official: {
    label: '官方',
    color: '#0071E3',
    bg: 'rgba(0, 113, 227, 0.08)',
    border: 'rgba(0, 113, 227, 0.2)',
  },
  authoritative: {
    label: '权威媒体',
    color: '#FF9500',
    bg: 'rgba(255, 149, 0, 0.08)',
    border: 'rgba(255, 149, 0, 0.2)',
  },
  unverified: {
    label: '待核实',
    color: '#8E8E93',
    bg: 'rgba(142, 142, 147, 0.08)',
    border: 'rgba(142, 142, 147, 0.2)',
  },
};

// Flow status config
export const FLOW_STATUS_CONFIG: Record<FlowStatus, { label: string; color: string; bg: string }> = {
  confirmed: { label: '已确认', color: '#34C759', bg: 'rgba(52, 199, 89, 0.1)' },
  pending: { label: '待核实', color: '#FF9500', bg: 'rgba(255, 149, 0, 0.1)' },
  rumor: { label: '传闻', color: '#8E8E93', bg: 'rgba(142, 142, 147, 0.1)' },
};

// Event type labels
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  restructure: '架构重组',
  appointment: '人事任命',
  resignation: '离职变动',
  merge: '部门合并',
  split: '部门拆分',
  other: '其他',
};

// Change type config (for comparison mode)
export const CHANGE_TYPE_CONFIG: Record<ChangeType, { label: string; color: string; bg: string }> = {
  new: { label: '新建', color: '#34C759', bg: 'rgba(52, 199, 89, 0.12)' },
  removed: { label: '撤销', color: '#FF3B30', bg: 'rgba(255, 59, 48, 0.12)' },
  adjusted: { label: '调整', color: '#FFCC00', bg: 'rgba(255, 204, 0, 0.12)' },
  unchanged: { label: '未变', color: '#8E8E93', bg: 'rgba(142, 142, 147, 0.08)' },
};
