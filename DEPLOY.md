# OE Intelligence Hub - 部署指南

## 项目结构

```
app/
├── dist/                    # 前端构建产物（已部署到静态托管）
├── src/                     # 前端源码
├── server/                  # Python FastAPI 后端
│   ├── main.py              # 主应用入口
│   ├── models.py            # 数据模型
│   ├── requirements.txt     # Python 依赖
│   ├── Procfile             # Render/Heroku 部署配置
│   ├── runtime.txt          # Python 版本
│   └── .env.example         # 环境变量示例
├── .env                     # 前端环境变量（API Base URL）
└── DEPLOY.md                # 本文件
```

## 前端

已自动部署到静态托管，无需额外操作。

**访问地址**：https://rt6vsi6ybe24u.ok.kimi.link

## 后端部署（Python FastAPI）

后端需要独立部署，支持以下方式：

### 方式一：Render（推荐）

1. 在 [render.com](https://render.com) 注册账号
2. 创建新的 Web Service
3. 连接 GitHub 仓库或手动上传代码
4. 配置：
   - **Build Command**: `pip install -r server/requirements.txt`
   - **Start Command**: `cd server && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Python Version**: 3.11
5. 添加环境变量：
   - `KIMI_API_KEY`: 你的 Kimi API Key（从 moonshot.cn 获取）
   - `KIMI_BASE_URL`: `https://api.moonshot.cn/v1`
   - `ALLOWED_ORIGINS`: 前端域名（如 `https://rt6vsi6ybe24u.ok.kimi.link`）

### 方式二：本地开发

```bash
# 1. 安装依赖
cd server
pip install -r requirements.txt

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 KIMI_API_KEY

# 3. 启动服务
uvicorn main:app --reload --port 8000

# 4. 测试
open http://localhost:8000/health
```

### 方式三：Docker

```bash
# 构建镜像
docker build -t oe-intel-hub -f server/Dockerfile .

# 运行容器
docker run -p 8000:8000 \
  -e KIMI_API_KEY=your_key_here \
  -e ALLOWED_ORIGINS=http://localhost:5173 \
  oe-intel-hub
```

### 方式四：Streamlit Cloud（快速体验）

1. 在代码中创建一个 `app.py`（Streamlit 版本）
2. 部署到 [share.streamlit.io](https://share.streamlit.io)
3. 配置 Secrets：`KIMI_API_KEY`

## 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `KIMI_API_KEY` | 是 | Kimi API Key，从 [moonshot.cn](https://platform.moonshot.cn) 获取 |
| `KIMI_BASE_URL` | 否 | 默认 `https://api.moonshot.cn/v1` |
| `PORT` | 否 | 服务端口，默认 8000 |
| `ALLOWED_ORIGINS` | 否 | CORS 允许的前端域名，逗号分隔 |

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 服务状态 |
| `/health` | GET | 健康检查 |
| `/api/search` | POST | 搜索组织架构情报 |
| `/api/compare` | POST | 历史架构对比 |

### 搜索请求示例

```bash
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{"company": "字节跳动", "business_line": "抖音"}'
```

### 响应格式

```json
{
  "company": "字节跳动",
  "business_line": "抖音",
  "query_time": "2024-01-15T10:30:00",
  "has_data": true,
  "nodes": [...],
  "edges": [...],
  "timeline": [...],
  "executive_flow": [...],
  "rumors": [...]
}
```

## 技术栈

- **前端**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Framer Motion + ECharts
- **后端**: Python 3.11 + FastAPI + httpx
- **AI API**: Kimi (Moonshot) with `$web_search` tool
- **部署**: 前端静态托管 + 后端 Render/本地/Docker

## 注意事项

1. **Kimi API Key 是必填项**，没有它后端无法执行搜索
2. 前端 `.env` 中的 `VITE_API_BASE` 需要指向实际部署的后端地址
3. 所有数据实时检索，不写死任何静态数据
4. 未检索到数据时会明确提示，绝不展示编造内容
