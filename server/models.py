"""
OE Intelligence Hub - Pydantic Data Models (v1 compatible)
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class SourceMetadata(BaseModel):
    source_url: str
    credibility: str
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
    flow_type: str
    status: str
    from_company: Optional[str] = None
    to_company: Optional[str] = None
    date: str
    metadata: SourceMetadata


class SearchRequest(BaseModel):
    company: str
    business_line: Optional[str] = None


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


class ComparisonRequest(BaseModel):
    company: str
    date_a: str
    date_b: str


class ComparisonResponse(BaseModel):
    company: str
    date_a: str
    date_b: str
    nodes_a: List[OrgNode]
    nodes_b: List[OrgNode]
    diff_nodes: List[OrgNode] = []
