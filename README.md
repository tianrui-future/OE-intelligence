# OE Intelligence Hub（竞对公司组织效能情报站）

全栈实时联网检索的企业组织架构情报平台，Apple 生态美学设计。

## 功能特性

- **实时联网检索**：通过 Kimi API 的 `$web_search` 工具实时搜索互联网最新信息
- **信息溯源系统**：每个数据节点包含 source_url、credibility 徽章（三级颜色）、update_time
- **传闻隔离区**：无来源的信息以灰色隔离卡片展示，不与主数据混排
- **交互式树状图**：ECharts 可交互组织架构图，点击展开/收起，双击查看历史
- **时间轴视图**：垂直时间轴展示近6个月调整节点
- **高管流动面板**：横向卡片流，含状态标签和筛选器
- **历史对比模式**：对比两个时间节点架构差异，绿色=新建、红色=撤销、黄色=调整

## Apple 生态美学

- 字体栈：SF Pro / -apple-system
- 背景色：#F5F5F7（浅灰白）
- 主色调：#0071E3（Apple 蓝）
- 卡片：圆角 16px，box-shadow: 0 4px 16px rgba(0,0,0,0.06)
- 顶部导航：backdrop-filter: blur(20px) 毛玻璃
- 所有切换 ease-out 300ms

## 快速开始

### 前端（已部署）

**在线地址**：https://rt6vsi6ybe24u.ok.kimi.link

本地开发：
```bash
cd app
npm install
npm run dev
```

### 后端（需单独部署）

**要求**：Python 3.11+

```bash
cd app/server
pip install -r requirements.txt

# 配置环境变量
export KIMI_API_KEY=your_kimi_api_key

# 启动
uvicorn main:app --reload
```

详细部署说明见 [DEPLOY.md](./DEPLOY.md)。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion + ECharts |
| 后端 | Python 3.11 + FastAPI + httpx |
| AI | Kimi API (moonshot.cn) with `$web_search` tool |

## 项目结构

```
app/
├── src/                     # 前端源码
│   ├── components/ui-custom/  # 核心组件
│   ├── services/api.ts      # API 服务层
│   ├── types/index.ts       # 类型定义
│   └── App.tsx              # 主应用
├── server/                  # Python FastAPI 后端
│   ├── main.py              # 主应用
│   ├── models.py            # 数据模型
│   ├── requirements.txt     # 依赖
│   └── Dockerfile           # Docker 配置
├── dist/                    # 构建产物
└── DEPLOY.md                # 部署指南
```

## 数据流

1. 用户输入"公司名-业务线"
2. 前端调用后端 `/api/search`
3. 后端调用 Kimi API（带 `$web_search` 工具）实时检索
4. 检索关键词：`{公司名} {业务线} 组织架构调整`、`{公司名} 高管变动`、`{公司名} {业务线} 部门负责人`
5. 返回结构化 JSON（nodes, edges, timeline, executive_flow）
6. 前端可视化渲染

## License

MIT
