/**
 * OE Intelligence Hub - API Service
 * Communicates with Python FastAPI backend
 */
import type { SearchRequest, SearchResponse } from '@/types';

const API_BASE =  = import..meta..env..VITE_API_BASE ||  || 'https://oe-intelligence.onrender.com';;

export async function searchOrgIntelligence(req: SearchRequest): Promise<SearchResponse> {
  const resp = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.detail || `Search failed: ${resp.status}`);
  }

  return resp.json();
}

export async function compareHistory(company: string, dateA: string, dateB: string) {
  const resp = await fetch(`${API_BASE}/api/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company, date_a: dateA, date_b: dateB }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.detail || `Comparison failed: ${resp.status}`);
  }

  return resp.json();
}

export async function checkHealth(): Promise<{ status: string; kimi_configured: boolean }> {
  const resp = await fetch(`${API_BASE}/health`, { method: 'GET' });
  if (!resp.ok) throw new Error('Health check failed');
  return resp.json();
}
