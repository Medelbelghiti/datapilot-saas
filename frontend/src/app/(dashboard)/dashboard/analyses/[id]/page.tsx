"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { PlotlyChart } from "@/components/charts/plotly-chart";
import { SkeletonAnalysis } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  BarChart3,
  Brain,
  AlertTriangle,
  FileText,
  Columns,
  Rows3,
  Target,
  Trash2,
  Download,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Analysis, AnalysisResult } from "@/types";
import { formatDate } from "@/lib/utils-helpers";

type Tab = "overview" | "quality" | "statistics" | "correlations" | "outliers" | "charts" | "ai";

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: a } = await supabase
        .from("analyses")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (!a) { router.push("/dashboard/analyses"); return; }
      setAnalysis(a);

      const { data: r } = await supabase
        .from("analysis_results")
        .select("*")
        .eq("analysis_id", id)
        .single();
      if (r) setResult(r);
      setLoading(false);
    }
    load();
  }, [id]);

  async function generateAIInsights() {
    setAiLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/api/analyses/${id}/ai-insights`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token || ""}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResult((prev) => prev ? { ...prev, ai_insights: data } : null);
      toast("success", "AI insights generated successfully!");
    } catch {
      toast("error", "Failed to generate AI insights. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  async function generateReport() {
    setReportLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/api/analyses/${id}/report`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token || ""}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      window.open(data.download_url, "_blank");
      toast("success", "PDF report generated!");
    } catch {
      toast("error", "Failed to generate report.");
    } finally {
      setReportLoading(false);
    }
  }

  async function deleteAnalysis() {
    setDeleting(true);
    const { error } = await supabase.from("analyses").delete().eq("id", id);
    if (!error) {
      toast("success", "Analysis deleted.");
      router.push("/dashboard/analyses");
    } else {
      toast("error", "Failed to delete analysis.");
    }
    setDeleting(false);
    setDeleteOpen(false);
  }

  if (loading) return <SkeletonAnalysis />;
  if (!analysis) return null;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "quality", label: "Data Quality", icon: Target },
    { key: "statistics", label: "Statistics", icon: Rows3 },
    { key: "correlations", label: "Correlations", icon: Columns },
    { key: "outliers", label: "Outliers", icon: AlertTriangle },
    { key: "charts", label: "Charts", icon: BarChart3 },
    { key: "ai", label: "AI Insights", icon: Brain },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteAnalysis}
        title="Delete Analysis"
        description="This will permanently delete this analysis and all its results. This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/analyses">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{analysis.file_name}</h1>
            <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <Badge variant={analysis.status === "completed" ? "success" : analysis.status === "failed" ? "error" : "warning"}>
                {analysis.status}
              </Badge>
              <span>·</span>
              <span>{formatDate(analysis.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={generateAIInsights} loading={aiLoading} disabled={!result} className="gap-2">
            <Brain className="h-4 w-4" /> AI Insights
          </Button>
          <Button variant="outline" size="sm" onClick={generateReport} loading={reportLoading} disabled={!result} className="gap-2">
            <FileText className="h-4 w-4" /> PDF Report
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)} className="text-error-600 hover:text-error-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 pb-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key
                ? "border-brand-600 text-brand-700 dark:text-brand-400"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {tab === "overview" && result && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Rows", value: result.data_quality?.total_rows?.toLocaleString() || "0" },
                { label: "Columns", value: String(result.data_quality?.total_columns || 0) },
                { label: "Missing Values", value: String(result.data_quality?.missing_values || 0) },
                { label: "Quality Score", value: `${result.data_quality?.quality_score || 0}/100` },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-4">
                    <p className="text-xs text-neutral-500 mb-1">{s.label}</p>
                    <p className="text-xl font-bold">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {result.ai_insights?.executive_summary && (
              <Card>
                <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{result.ai_insights.executive_summary}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {tab === "quality" && result && (
          <Card>
            <CardHeader><CardTitle>Data Quality</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th className="text-left py-2 font-medium text-neutral-500">Column</th>
                      <th className="text-left py-2 font-medium text-neutral-500">Type</th>
                      <th className="text-right py-2 font-medium text-neutral-500">Missing</th>
                      <th className="text-right py-2 font-medium text-neutral-500">Missing %</th>
                      <th className="text-right py-2 font-medium text-neutral-500">Unique</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data_quality?.columns?.map((col) => (
                      <tr key={col.column} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <td className="py-2 font-medium">{col.column}</td>
                        <td className="py-2 text-neutral-500">{col.dtype}</td>
                        <td className="py-2 text-right">{col.missing}</td>
                        <td className="py-2 text-right">{col.missing_pct.toFixed(1)}%</td>
                        <td className="py-2 text-right">{col.unique}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "statistics" && result && (
          <Card>
            <CardHeader><CardTitle>Statistics</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th className="text-left py-2 font-medium text-neutral-500">Column</th>
                      <th className="text-right py-2 font-medium text-neutral-500">Mean</th>
                      <th className="text-right py-2 font-medium text-neutral-500">Median</th>
                      <th className="text-right py-2 font-medium text-neutral-500">Std Dev</th>
                      <th className="text-right py-2 font-medium text-neutral-500">Min</th>
                      <th className="text-right py-2 font-medium text-neutral-500">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.statistics?.filter((s) => s.mean !== undefined).map((s) => (
                      <tr key={s.column} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <td className="py-2 font-medium">{s.column}</td>
                        <td className="py-2 text-right">{s.mean?.toFixed(2) || "—"}</td>
                        <td className="py-2 text-right">{s.median?.toFixed(2) || "—"}</td>
                        <td className="py-2 text-right">{s.std?.toFixed(2) || "—"}</td>
                        <td className="py-2 text-right">{String(s.min ?? "—")}</td>
                        <td className="py-2 text-right">{String(s.max ?? "—")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "correlations" && result && (
          <Card>
            <CardHeader><CardTitle>Correlations</CardTitle></CardHeader>
            <CardContent>
              {result.correlations?.length === 0 ? (
                <p className="text-neutral-500 text-sm">No significant correlations found.</p>
              ) : (
                <div className="space-y-3">
                  {result.correlations?.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      <div>
                        <p className="text-sm font-medium">{c.col1} ↔ {c.col2}</p>
                        <p className="text-xs text-neutral-500 capitalize">{c.strength.replace("_", " ")}</p>
                      </div>
                      <Badge variant={c.correlation > 0 ? "success" : c.correlation < 0 ? "error" : "secondary"}>
                        {c.correlation.toFixed(3)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "outliers" && result && (
          <Card>
            <CardHeader><CardTitle>Outliers</CardTitle></CardHeader>
            <CardContent>
              {result.outliers?.length === 0 ? (
                <p className="text-neutral-500 text-sm">No outliers detected.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800">
                        <th className="text-left py-2 font-medium text-neutral-500">Variable</th>
                        <th className="text-right py-2 font-medium text-neutral-500">Count</th>
                        <th className="text-right py-2 font-medium text-neutral-500">Percentage</th>
                        <th className="text-left py-2 font-medium text-neutral-500">Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.outliers?.map((o, i) => (
                        <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                          <td className="py-2 font-medium">{o.column}</td>
                          <td className="py-2 text-right">{o.count}</td>
                          <td className="py-2 text-right">{o.percentage.toFixed(1)}%</td>
                          <td className="py-2 text-neutral-500">{o.method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "charts" && result && (
          <div className="space-y-4">
            {result.charts?.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-neutral-500">No charts generated.</CardContent></Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {result.charts?.map((chart) => (
                  <Card key={chart.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{chart.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PlotlyChart data={chart.data} className="h-64" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "ai" && (
          <div className="space-y-4">
            {!result?.ai_insights ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Brain className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 mb-4">No AI insights generated yet.</p>
                  <Button onClick={generateAIInsights} loading={aiLoading} className="gap-2">
                    <Brain className="h-4 w-4" /> Generate AI Insights
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{result.ai_insights.executive_summary}</p>
                  </CardContent>
                </Card>
                {result.ai_insights.key_findings?.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Key Findings</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.ai_insights.key_findings.map((f, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-brand-600 mt-1">•</span>{f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {result.ai_insights.recommendations?.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Recommendations</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.ai_insights.recommendations.map((r, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-success-600 mt-1">→</span>{r}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {result.ai_insights.potential_risks?.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Potential Risks</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.ai_insights.potential_risks.map((r, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-warning-600 mt-1">!</span>{r}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
