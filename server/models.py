"""
OE Intelligence Hub - Pydantic Data Models (v1 compatible)
JSON Schema: company, nodes[], edges[], timeline[], executive_flow[]
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class SourceMetadata(BaseModel):
    """每个数据节点的元数据"""
    source_url: str = Field(..., description="完整可点击的新闻源链接")
    credibility: str = Field(..., description="可信度: official=官方公告, authoritative=权威媒体, unverified=待核实")
    update_time: str = Field(..., description="精确到月份的更新时间, 格式: YYYY-MM")


class OrgNode(BaseModel):
    """组织架构树节点"""
    id: str
    name: str = Field(..., description="部门名称")
    leader: Optional[str] = Field(None, description="负责人姓名")
    leader_title: Optional[str] = Field(None, description="负责人职位")
    parent_id: Optional[str] = Field(None, description="父部门ID")
    level: int = Field(1, description="层级")
    metadata: Optional[SourceMetadata] = None
    is_rumor: bool = Field(False, description="是否为传闻区信息")
    change_type: Optional[str] = Field(None, description="变更类型(用于对比模式): new/removed/adjusted/unchanged")


class OrgEdge(BaseModel):
    """组织架构边(汇报关系)"""
    source: str = Field(..., description="源节点ID")
    target: str = Field(..., description="目标节点ID")


class TimelineEvent(BaseModel):
    """时间轴事件"""
    id: str
    date: str = Field(..., description="事件日期 YYYY-MM-DD")
    title: str = Field(..., description="事件标题")
    description: str = Field(..., description="事件描述")
    department: Optional[str] = Field(None, description="涉及部门")
    event_type: str = Field("other", description="事件类型: restructure/appointment/resignation/merge/split/other")
    metadata: SourceMetadata
    is_rumor: bool = False


class ExecutiveFlow(BaseModel):
    """高管流动记录"""
    id: str
    name: str = Field(..., description="高管姓名")
    title: str = Field(..., description="职位")
    flow_type: str = Field(..., description="流入或流出: inflow/outflow")
    status: str = Field(..., description="状态标签: confirmed/pending/rumor")
    from_company: Optional[str] = Field(None, description="来自公司")
    to_company: Optional[str] = Field(None, description="去向公司")
    date: str = Field(..., description="日期 YYYY-MM-DD")
    metadata: SourceMetadata


class SearchRequest(BaseModel):
    """搜索请求"""
    company: str = Field(..., description="公司名称")
    business_line: Optional[str] = Field(None, description="业务线")


class SearchResponse(BaseModel):
    """搜索响应"""
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


class ComparisonRequest(BaseModel):
    """历史对比请求"""
    company: str
    date_a: str = Field(..., description="对比日期A YYYY-MM")
    date_b: str = Field(..., description="对比日期B YYYY-MM")


class ComparisonResponse(BaseModel):
    """历史对比响应"""
    company: str
    date_a: str
    date_b: str
    nodes_a: List[OrgNode]
    nodes_b: List[OrgNode]
    diff_nodes: List[OrgNode] = Field(..., description="差异节点(带change_type)")
