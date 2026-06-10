/**
 * Interactive Org Tree Diagram - ECharts
 * Displays department hierarchy with leaders
 * Click to expand/collapse, double-click to view history
 */
import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as echarts from 'echarts';
import type { OrgNode, OrgEdge } from '@/types';

interface OrgTreeProps {
  nodes: OrgNode[];
  edges: OrgEdge[];
  onNodeClick?: (node: OrgNode) => void;
  onNodeDoubleClick?: (node: OrgNode) => void;
}

// Convert flat nodes+edges to ECharts tree data
function buildTreeData(nodes: OrgNode[]): any {
  if (nodes.length === 0) return null;

  const nodeMap = new Map<string, OrgNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Find root(s) - nodes without parent or with parent not in set
  const rootCandidates = nodes.filter((n) => !n.parent_id || !nodeMap.has(n.parent_id));

  if (rootCandidates.length === 0) {
    // Fallback: use first node as root
    rootCandidates.push(nodes[0]);
  }

  function convertNode(node: OrgNode): any {
    const children = nodes.filter((n) => n.parent_id === node.id);
    const result: any = {
      name: node.name,
      value: node.leader || '待定',
      leader: node.leader,
      leaderTitle: node.leader_title,
      id: node.id,
      itemStyle: {
        color: node.change_type
          ? getChangeColor(node.change_type)
          : node.is_rumor
            ? '#E5E5EA'
            : '#0071E3',
      },
      label: {
        formatter: (params: any) => {
          const name = params.name;
          const leader = params.data?.leader || '';
          return leader ? `{name|${name}}\n{leader|${leader}}` : `{name|${name}}`;
        },
        rich: {
          name: {
            fontSize: 13,
            fontWeight: 600,
            color: '#1D1D1F',
            padding: [4, 0],
          },
          leader: {
            fontSize: 11,
            color: '#86868B',
            padding: [2, 0],
          },
        },
      },
    };

    if (children.length > 0) {
      result.children = children.map(convertNode);
      result.collapsed = false;
    }

    return result;
  }

  if (rootCandidates.length === 1) {
    return convertNode(rootCandidates[0]);
  }

  // Multiple roots: create virtual root
  return {
    name: '组织架构',
    value: '',
    itemStyle: { color: '#86868B' },
    children: rootCandidates.map(convertNode),
  };
}

function getChangeColor(changeType: string): string {
  const colors: Record<string, string> = {
    new: '#34C759',
    removed: '#FF3B30',
    adjusted: '#FFCC00',
    unchanged: '#8E8E93',
  };
  return colors[changeType] || '#0071E3';
}

export function OrgTree({ nodes, edges, onNodeClick }: OrgTreeProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const initChart = useCallback(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    const chart = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });
    chartInstance.current = chart;

    const treeData = buildTreeData(nodes);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E5EA',
        borderWidth: 1,
        borderRadius: 12,
        padding: [12, 16],
        textStyle: {
          color: '#1D1D1F',
          fontSize: 13,
        },
        formatter: (params: any) => {
          const data = params.data;
          let html = `<div style="font-weight:600;margin-bottom:4px">${data.name}</div>`;
          if (data.leader) {
            html += `<div style="color:#86868B;font-size:12px">负责人: ${data.leader}</div>`;
          }
          if (data.leaderTitle) {
            html += `<div style="color:#86868B;font-size:11px">${data.leaderTitle}</div>`;
          }
          return html;
        },
      },
      series: [
        {
          type: 'tree',
          data: treeData ? [treeData] : [],
          top: '5%',
          left: '8%',
          bottom: '5%',
          right: '8%',
          symbolSize: 14,
          symbol: 'circle',
          edgeShape: 'curve',
          edgeForkPosition: '63%',
          initialTreeDepth: 3,
          roam: true,
          label: {
            position: 'top',
            verticalAlign: 'middle',
            align: 'center',
            fontSize: 13,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif',
          },
          leaves: {
            label: {
              position: 'bottom',
              verticalAlign: 'middle',
              align: 'center',
            },
          },
          emphasis: {
            focus: 'descendant',
            itemStyle: {
              shadowBlur: 12,
              shadowColor: 'rgba(0,0,0,0.15)',
            },
          },
          expandAndCollapse: true,
          animationDuration: 400,
          animationDurationUpdate: 300,
          animationEasing: 'cubicOut',
          animationEasingUpdate: 'cubicOut',
          lineStyle: {
            color: '#D2D2D7',
            width: 1.5,
            curveness: 0.5,
          },
        },
      ],
    };

    chart.setOption(option);

    // Click handler
    chart.on('click', (params: any) => {
      const nodeId = params.data?.id;
      if (nodeId && onNodeClick) {
        const node = nodes.find((n) => n.id === nodeId);
        if (node) onNodeClick(node);
      }
    });

    // Resize handler
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [nodes, edges, onNodeClick]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const cleanup = initChart();
    return cleanup;
  }, [nodes, edges, initChart]);

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#86868B]">
        <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="text-sm">搜索公司后显示组织架构树</p>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div ref={chartRef} className="w-full h-full" />
    </motion.div>
  );
}
