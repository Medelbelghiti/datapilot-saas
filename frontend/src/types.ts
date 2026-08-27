export type Plan = "free" | "pro" | "business";

export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  polar_customer_id: string | null;
  polar_subscription_id: string | null;
  polar_product_id: string | null;
  plan: Plan;
  status: string;
  billing_interval: "monthly" | "yearly" | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Usage {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  analysis_count: number;
  created_at: string;
  updated_at: string;
}

export type AnalysisStatus = "pending" | "uploading" | "processing" | "completed" | "failed";

export interface Analysis {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  rows_count: number | null;
  columns_count: number | null;
  status: AnalysisStatus;
  data_quality_score: number | null;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface ColumnStatistics {
  column: string;
  dtype: string;
  count: number;
  missing: number;
  missing_pct: number;
  unique: number;
  mean?: number;
  median?: number;
  std?: number;
  variance?: number;
  min?: number | string;
  max?: number | string;
  q1?: number;
  q3?: number;
  iqr?: number;
  mode?: string | number;
  frequency?: number;
}

export interface CorrelationPair {
  col1: string;
  col2: string;
  correlation: number;
  strength: "strong_positive" | "moderate_positive" | "weak" | "moderate_negative" | "strong_negative";
}

export interface OutlierInfo {
  column: string;
  count: number;
  percentage: number;
  method: string;
}

export interface DataQuality {
  total_rows: number;
  total_columns: number;
  missing_values: number;
  missing_pct: number;
  duplicate_rows: number;
  duplicate_pct: number;
  quality_score: number;
  columns: Array<{
    column: string;
    dtype: string;
    missing: number;
    missing_pct: number;
    unique: number;
    potential_issue: string | null;
  }>;
}

export interface AIInsights {
  executive_summary: string;
  key_findings: string[];
  data_quality_observations: string[];
  important_relationships: string[];
  potential_risks: string[];
  recommendations: string[];
  [key: string]: unknown;
}

export interface AnalysisResult {
  id: string;
  analysis_id: string;
  summary: Record<string, unknown>;
  data_quality: DataQuality;
  statistics: ColumnStatistics[];
  correlations: CorrelationPair[];
  outliers: OutlierInfo[];
  charts: Array<{
    id: string;
    type: string;
    title: string;
    data: unknown;
    config: Record<string, unknown>;
  }>;
  ai_insights: AIInsights | null;
  created_at: string;
}

export interface Report {
  id: string;
  analysis_id: string;
  user_id: string;
  file_path: string;
  created_at: string;
}

export interface PlanLimits {
  analyses_per_month: number;
  max_file_size_mb: number;
  excel_support: boolean;
  ai_insights: boolean;
  pdf_reports: boolean;
  correlations: boolean;
  outliers: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    analyses_per_month: 2,
    max_file_size_mb: 5,
    excel_support: false,
    ai_insights: false,
    pdf_reports: false,
    correlations: false,
    outliers: false,
  },
  pro: {
    analyses_per_month: 50,
    max_file_size_mb: 50,
    excel_support: true,
    ai_insights: true,
    pdf_reports: true,
    correlations: true,
    outliers: true,
  },
  business: {
    analyses_per_month: 250,
    max_file_size_mb: 200,
    excel_support: true,
    ai_insights: true,
    pdf_reports: true,
    correlations: true,
    outliers: true,
  },
};
