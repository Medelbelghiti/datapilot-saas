from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class AnalysisCreate(BaseModel):
    file_name: str
    file_size: int
    file_type: str


class AnalysisResponse(BaseModel):
    id: str
    user_id: str
    file_name: str
    file_size: int
    file_type: str
    rows_count: Optional[int] = None
    columns_count: Optional[int] = None
    status: str = "pending"
    data_quality_score: Optional[int] = None
    created_at: str
    completed_at: Optional[str] = None
    error_message: Optional[str] = None


class DataQualityColumn(BaseModel):
    column: str
    dtype: str
    missing: int
    missing_pct: float
    unique: int
    potential_issue: Optional[str] = None


class DataQualityResult(BaseModel):
    total_rows: int
    total_columns: int
    missing_values: int
    missing_pct: float
    duplicate_rows: int
    duplicate_pct: float
    quality_score: int
    columns: List[DataQualityColumn]


class ColumnStatistics(BaseModel):
    column: str
    dtype: str
    count: int
    missing: int
    missing_pct: float
    unique: int
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None
    variance: Optional[float] = None
    min: Optional[Any] = None
    max: Optional[Any] = None
    q1: Optional[float] = None
    q3: Optional[float] = None
    iqr: Optional[float] = None
    mode: Optional[Any] = None
    frequency: Optional[int] = None


class CorrelationPair(BaseModel):
    col1: str
    col2: str
    correlation: float
    strength: str


class OutlierInfo(BaseModel):
    column: str
    count: int
    percentage: float
    method: str


class ChartData(BaseModel):
    id: str
    type: str
    title: str
    data: Any
    config: dict = {}


class AIInsights(BaseModel):
    executive_summary: str = ""
    key_findings: List[str] = []
    data_quality_observations: List[str] = []
    important_relationships: List[str] = []
    potential_risks: List[str] = []
    recommendations: List[str] = []


class AnalysisResultResponse(BaseModel):
    id: str
    analysis_id: str
    summary: dict = {}
    data_quality: Optional[DataQualityResult] = None
    statistics: List[ColumnStatistics] = []
    correlations: List[CorrelationPair] = []
    outliers: List[OutlierInfo] = []
    charts: List[ChartData] = []
    ai_insights: Optional[AIInsights] = None
    created_at: str


class SubscriptionResponse(BaseModel):
    plan: str = "free"
    status: str = "active"
    billing_interval: Optional[str] = None
    current_period_start: Optional[str] = None
    current_period_end: Optional[str] = None
    cancel_at_period_end: bool = False
    polar_subscription_id: Optional[str] = None


class UsageResponse(BaseModel):
    usage_count: int
    limit: int
    plan: str
    remaining: int


class CheckoutRequest(BaseModel):
    product_id: str


class CheckoutResponse(BaseModel):
    url: str
    checkout_id: str


class CustomerPortalResponse(BaseModel):
    url: str


class ReportResponse(BaseModel):
    id: str
    analysis_id: str
    user_id: str
    file_path: str
    created_at: str


class WebhookEventLog(BaseModel):
    provider: str
    event_id: str
    event_type: str
    processed: bool = True


class ContactFormRequest(BaseModel):
    name: str
    email: str
    message: str


class AIInsightsRequest(BaseModel):
    analysis_id: str


class ReportRequest(BaseModel):
    analysis_id: str
