/**
 * OE Intelligence Hub - API Service
 * Communicates with Python Flask backend
 */
import type { SearchRequest, SearchResponse } from '@/types';

// ✅ 修复语法错误
const API_BASE = import.meta.env.VITE_API_BASE || 'https://oe-intelligence.onrender.com';

console.log('API_BASE:', API_BASE); // 调试日志

export async function searchOrgIntelligence(req: SearchRequest): Promise<<SearchResponse> {
  const url = `${API_BASE}/api/search`;
  console.log('Search URL:', url); // 调试日志
  
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.detail || err.error || `Search failed: ${resp.status}`);
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
    throw new Error(err.detail || err.error || `Comparison failed: ${resp.status}`);
  }

  return resp.json();
}

export async function checkHealth(): Promise<{ status: string; kimi_configured: boolean }> {
  const url = `${API_BASE}/health`;
  console.log('Health URL:', url); // 调试日志
  
  const resp = await fetch(url, { method: 'GET' });
  if (!resp.ok) throw new Error('Health check
