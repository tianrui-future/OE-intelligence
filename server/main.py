"""
OE Intelligence Hub - FastAPI Backend
Calls Kimi API with $web_search tool for real-time data retrieval
"""
import os
import json
import re
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import httpx

# Load environment variables
load_dotenv()

# Kimi API configuration
KIMI_API_KEY = os.getenv("KIMI_API_KEY", "")
KIMI_BASE_URL = os.getenv("KIMI_BASE_URL", "https://api.moonshot.cn/v1")

app = FastAPI(
    title="OE Intelligence Hub API",
    description="Competitive Company Org Intelligence - Real-time via Kimi $web_search",
    version="1.0.0"
)

# CORS
origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
origins = [o.strip() for o in origins_str.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ Pydantic Models (inline to avoid import issues) ============

class SearchRequest(BaseModel):
    company: str
    business_line: Optional[str] = None


class SourceMetadata(BaseModel):
    source_url: str
    credibility: str  # "official" | "authoritative" | "unverified"
    update_time: str


class OrgNode(BaseModel):
    id: str
    name: str
    leader: Optional[str] = None
    leader_title: Optional[str] = None
    parent_id: Optional[str] = None
    level: int = 1
    metadata: Optional[SourceMetadata] = None
    is_rumor: bool = False
    change_type: Optional[str] = None


class OrgEdge(BaseModel):
    source: str
    target: str


class TimelineEvent(BaseModel):
    id: str
    date: str
    title: str
    description: str
    department: Optional[str] = None
    event_type: str = "other"
    metadata: SourceMetadata
    is_rumor: bool = False


class ExecutiveFlow(BaseModel):
    id: str
    name: str
    title: str
    flow_type: str  # "inflow" | "outflow"
    status: str  # "confirmed" | "pending" | "rumor"
    from_company: Optional[str] = None
    to_company: Optional[str] = None
    date: str
    metadata: SourceMetadata


class SearchResponse(BaseModel):
    company: str
    business_line: Optional[str]
    query_time: str
    nodes: List[OrgNode] = []
    edges: List[OrgEdge] = []
    timeline: List[TimelineEvent] = []
    executive_flow: List[ExecutiveFlow] = []
    has_data: bool = True
    message: Optional[str] = None
    rumors: List[dict] = []


# ============ Kimi API Integration ============

async def call_kimi_with_search(system_prompt: str, user_query: str) -> str:
    """Call Kimi API with $web_search tool enabled"""
    if not KIMI_API_KEY:
        raise HTTPException(status_code=500, detail="KIMI_API_KEY not configured")

    headers = {
        "Authorization": f"Bearer {KIMI_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "moonshot-v1-128k",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query}
        ],
        "tools": [{"type": "builtin_function", "function": {"name": "$web_search"}}],
        "temperature": 0.3
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            resp = await client.post(
                f"{KIMI_BASE_URL}/chat/completions",
                headers=headers,
                json=payload
            )
            resp.raise_for_status()
            data = resp.json()
            
            # Extract content from response
            content = ""
            if "choices" in data and len(data["choices"]) > 0:
                choice = data["choices"][0]
                if "message" in choice and "content" in choice["message"]:
                    content = choice["message"]["content"]
            return content
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Kimi API error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")


def build_search_queries(company: str, business_line: Optional[str]) -> List[str]:
    """构建检索关键词"""
    bl_suffix = f" {business_line}" if business_line else ""
    return [
        f"{company}{bl_suffix} 组织架构调整",
        f"{company} 高管变动",
        f"{company}{bl_suffix} 部门负责人"
    ]


def parse_date_from_text(text: str) -> Optional[str]:
    """从文本中提取日期"""
    # Match YYYY-MM-DD or YYYY-MM
    patterns = [
        r'(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})',
        r'(\d{4})[年/-](\d{1,2})',
    ]
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            groups = m.groups()
            if len(groups) == 3:
                return f"{groups[0]}-{int(groups[1]):02d}-{int(groups[2]):02d}"
            elif len(groups) == 2:
                return f"{groups[0]}-{int(groups[1]):02d}-01"
    return None


def determine_credibility(text: str, source_url: str) -> str:
    """确定可信度等级"""
    official_indicators = ["公告", "财报", "年报", "官方", "微信公众号", "ir.", "investor"]
    authoritative_media = ["36氪", "虎嗅", "晚点", "LatePost", "财新", "caixin",
                          "第一财经", "界面", "澎湃新闻", "新浪科技", "腾讯科技",
                          "华尔街见闻", "Reuters", "Bloomberg", "Financial Times"]
    
    text_lower = text.lower()
    url_lower = source_url.lower()
    
    for ind in official_indicators:
        if ind.lower() in text_lower or ind.lower() in url_lower:
            return "official"
    
    for media in authoritative_media:
        if media.lower() in text_lower or media.lower() in url_lower:
            return "authoritative"
    
    return "unverified"


def extract_structured_data(raw_content: str, company: str, business_line: Optional[str]) -> Dict[str, Any]:
    """从 Kimi 返回的文本中提取结构化数据"""
    nodes: List[OrgNode] = []
    edges: List[OrgEdge] = []
    timeline: List[TimelineEvent] = []
    executive_flow: List[ExecutiveFlow] = []
    rumors: List[Dict] = []
    
    # Try to find JSON block in response
    json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', raw_content, re.DOTALL)
    if json_match:
        try:
            parsed = json.loads(json_match.group(1).strip())
            if isinstance(parsed, dict):
                if "nodes" in parsed:
                    for n in parsed["nodes"]:
                        nodes.append(OrgNode(**n))
                if "edges" in parsed:
                    for e in parsed["edges"]:
                        edges.append(OrgEdge(**e))
                if "timeline" in parsed:
                    for t in parsed["timeline"]:
                        timeline.append(TimelineEvent(**t))
                if "executive_flow" in parsed:
                    for ef in parsed["executive_flow"]:
                        executive_flow.append(ExecutiveFlow(**ef))
        except Exception:
            pass  # Fall through to text parsing
    
    # If no structured JSON, generate from text analysis
    if not nodes and not timeline and not executive_flow:
        # Generate a basic structure from the raw content
        # This is fallback - the LLM should ideally return JSON
        current_date = datetime.now().strftime("%Y-%m-%d")
        current_month = datetime.now().strftime("%Y-%m")
        
        # Check if there's any substantive content
        lines = [l.strip() for l in raw_content.split('\n') if l.strip()]
        if len(lines) > 3:
            # Create a single timeline entry for the search result
            timeline.append(TimelineEvent(
                id=f"evt_{company}_001",
                date=current_date,
                title=f"{company} 组织架构相关信息检索结果",
                description=raw_content[:500] + "..." if len(raw_content) > 500 else raw_content,
                department=business_line or "全公司",
                event_type="other",
                metadata=SourceMetadata(
                    source_url="https://www.google.com/search",
                    credibility="unverified",
                    update_time=current_month
                )
            ))
    
    
    return {
    "nodes": [n.dict() for n in nodes],
    "edges": [e.dict() for e in edges],
    "timeline": [t.dict() for t in timeline],
    "executive_flow": [ef.dict() for ef in executive_flow],
    "rumors": rumors
}


# ============ API Endpoints ============

@app.get("/")
async def root():
    return {"status": "OE Intelligence Hub API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok", "kimi_configured": bool(KIMI_API_KEY)}


@app.post("/api/search", response_model=SearchResponse)
async def search_org_intelligence(req: SearchRequest):
    """
    搜索公司组织架构情报
    1. 调用 Kimi API 进行 $web_search
    2. 检索关键词: 公司名 业务线 组织架构调整、高管变动、部门负责人
    3. 返回结构化数据
    """
    company = req.company.strip()
    business_line = req.business_line.strip() if req.business_line else None
    
    if not company:
        raise HTTPException(status_code=400, detail="Company name is required")
    
    queries = build_search_queries(company, business_line)
    
    # System prompt for structured extraction
    system_prompt = """你是一家企业情报分析专家。你的任务是基于网络搜索结果，提取公司组织架构调整信息。

你必须返回严格格式化的 JSON，包含以下字段：
- nodes: 部门节点数组，每个节点包含 id, name, leader, leader_title, parent_id, level, metadata{source_url, credibility, update_time}, is_rumor
- edges: 汇报关系数组，每个包含 source(源ID), target(目标ID)
- timeline: 时间轴事件数组，每个包含 id, date(YYYY-MM-DD), title, description, department, event_type, metadata, is_rumor
- executive_flow: 高管流动数组，每个包含 id, name, title, flow_type(inflow/outflow), status(confirmed/pending/rumor), from_company, to_company, date, metadata

credibility 规则：
- official(官方): 公司公告、财报、官方公众号 → #0071E3
- authoritative(权威媒体): 36氪、虎嗅、晚点LatePost、财新 → #FF9500
- unverified(待核实): 脉脉、LinkedIn、无明确来源 → #E5E5EA

如果近3个月没有检索到公开报道，nodes和timeline设为空数组，并在message中说明。
确保所有 URL 完整可点击。不要编造不存在的信息。"""

    # Combine all queries into one search
    user_query = f"""请搜索以下关键词并提取 {company} 公司{business_line or ''} 的组织架构信息：

搜索关键词：
1. {queries[0]}
2. {queries[1]}
3. {queries[2]}

请按上述JSON格式返回提取结果。如果近3个月没有相关公开报道，请明确说明。"""

    try:
        raw_content = await call_kimi_with_search(system_prompt, user_query)
    except HTTPException:
        # Return empty result with message
        return SearchResponse(
            company=company,
            business_line=business_line,
            query_time=datetime.now().isoformat(),
            has_data=False,
            message=f"未检索到{company}-{business_line or '全公司'}近3个月的组织架构调整公开报道",
            nodes=[],
            edges=[],
            timeline=[],
            executive_flow=[],
            rumors=[]
        )
    
    # Check for no-data indicator in response
    no_data_indicators = ["未检索到", "没有", "暂无", "未找到", "未发现"]
    has_no_data = any(ind in raw_content for ind in no_data_indicators) and not any(
        key in raw_content for key in ["\"nodes\"", "nodes"]
    )
    
    if has_no_data or len(raw_content.strip()) < 50:
        return SearchResponse(
            company=company,
            business_line=business_line,
            query_time=datetime.now().isoformat(),
            has_data=False,
            message=f"未检索到{company}-{business_line or '全公司'}近3个月的组织架构调整公开报道",
            nodes=[],
            edges=[],
            timeline=[],
            executive_flow=[],
            rumors=[]
        )
    
    # Extract structured data
    structured = extract_structured_data(raw_content, company, business_line)
    
    # Separate rumors
    all_nodes = structured.get("nodes", [])
    rumor_nodes = [n for n in all_nodes if n.get("is_rumor", False)]
    main_nodes = [n for n in all_nodes if not n.get("is_rumor", False)]
    
    all_timeline = structured.get("timeline", [])
    rumor_timeline = [t for t in all_timeline if t.get("is_rumor", False)]
    main_timeline = [t for t in all_timeline if not t.get("is_rumor", False)]
    
    # Build rumor list for display
    rumors = []
    for rn in rumor_nodes:
        rumors.append({
            "type": "department",
            "content": f"{rn.get('name', '')} - {rn.get('leader', '未知负责人')}",
            "metadata": rn.get("metadata", {})
        })
    for rt in rumor_timeline:
        rumors.append({
            "type": "event",
            "content": rt.get("title", ""),
            "date": rt.get("date", ""),
            "metadata": rt.get("metadata", {})
        })
    
    has_data = len(main_nodes) > 0 or len(main_timeline) > 0 or len(structured.get("executive_flow", [])) > 0
    
    message = None
    if not has_data:
        message = f"未检索到{company}-{business_line or '全公司'}近3个月的组织架构调整公开报道"
    
    
    # 转换 dict 为模型对象
node_objs = []
for n in main_nodes:
    n.pop("metadata", None)  # 简化处理
    node_objs.append(OrgNode(**n))

edge_objs = [OrgEdge(**e) for e in structured.get("edges", [])]
timeline_objs = []
for t in main_timeline:
    t.pop("metadata", None)
    timeline_objs.append(TimelineEvent(**t))

exec_objs = []
for ef in structured.get("executive_flow", []):
    ef.pop("metadata", None)
    exec_objs.append(ExecutiveFlow(**ef))

return SearchResponse(
    company=company,
    business_line=business_line,
    query_time=datetime.now().isoformat(),
    nodes=node_objs,
    edges=edge_objs,
    timeline=timeline_objs,
    executive_flow=exec_objs,
    has_data=has_data,
    message=message,
    rumors=rumors
)


@app.post("/api/compare")
async def compare_history(req: dict):
    """
    历史对比模式 - 对比两个时间节点的架构差异
    """
    company = req.get("company", "")
    date_a = req.get("date_a", "")
    date_b = req.get("date_b", "")
    
    if not company or not date_a or not date_b:
        raise HTTPException(status_code=400, detail="company, date_a, date_b required")
    
    system_prompt = """你是一个企业组织架构对比分析专家。基于搜索结果，对比两个时间点的组织架构差异。

返回JSON格式：
{
  "diff_nodes": [
    {
      "id": "dept_id",
      "name": "部门名",
      "leader": "负责人",
      "change_type": "new|removed|adjusted|unchanged",
      "metadata": {"source_url": "...", "credibility": "...", "update_time": "..."}
    }
  ]
}

credibility规则同之前。"""

    user_query = f"""请搜索 {company} 在 {date_a} 和 {date_b} 两个时间点的组织架构，并对比差异。

搜索关键词：
- {company} {date_a} 组织架构
- {company} {date_b} 组织架构调整
- {company} {date_a} 到 {date_b} 部门变动

以JSON格式返回 diff_nodes 数组。"""

    raw_content = await call_kimi_with_search(system_prompt, user_query)
    
    # Parse diff
    diff_nodes = []
    json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', raw_content, re.DOTALL)
    if json_match:
        try:
            parsed = json.loads(json_match.group(1).strip())
            diff_nodes = parsed.get("diff_nodes", [])
        except Exception:
            pass
    
    return {
        "company": company,
        "date_a": date_a,
        "date_b": date_b,
        "diff_nodes": diff_nodes,
        "raw_analysis": raw_content[:2000] if not diff_nodes else None
    }


# For local development
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
