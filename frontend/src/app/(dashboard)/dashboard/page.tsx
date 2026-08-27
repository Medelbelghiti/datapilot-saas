"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight, FileBarChart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Analysis } from "@/types";
import { formatDate, formatFileSize } from "@/lib/utils-helpers";

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [usage, setUsage] = useState(0);
  const [plan, setPlan] = useState("free");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserName(user.user_metadata?.name || user.email?.split("@")[0] || "there");

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .single();
      if (sub) setPlan(sub.plan);

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const { data: usageData } = await supabase
        .from("usage")
        .select("analysis_count")
        .eq("user_id", user.id)
        .eq("period_start", periodStart)
        .single();
      if (usageData) setUsage(usageData.analysis_count);

      const { data: analysesData } = await supabase
        .from("analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (analysesData) setAnalyses(analysesData);

      setLoading(false);
    }
    load();
  }, []);

  const limits: Record<string, number> = { free: 2, pro: 50, business: 250 };
  const maxUsage = limits[plan] || 2;
  const usagePct = Math.min((usage / maxUsage) * 100, 100);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-64" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-neutral-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Here&apos;s an overview of your data analyses.
          </p>
        </div>
        <Link href="/dashboard/analyze">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Analysis
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Analyses Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage} / {maxUsage}
            </div>
            <div className="mt-2 h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePct > 80 ? "bg-error-500" : usagePct > 50 ? "bg-warning-500" : "bg-brand-500"
                }`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            {usage >= maxUsage && (
              <p className="mt-2 text-xs text-error-600">
                You&apos;ve reached your limit.{" "}
                <Link href="/dashboard/billing" className="underline">
                  Upgrade to Pro
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold capitalize">{plan}</span>
              <Badge variant={plan === "pro" ? "default" : "secondary"}>
                {plan === "free" ? "Free Tier" : plan === "pro" ? "Pro" : "Business"}
              </Badge>
            </div>
            {plan === "free" && (
              <Link href="/dashboard/billing" className="mt-2 inline-block text-sm text-brand-600 hover:underline">
                Upgrade to Pro →
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/dashboard/analyze">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <FileBarChart className="h-4 w-4" />
                  New Analysis
                </Button>
              </Link>
              <Link href="/dashboard/analyses">
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                  View History
                  <ArrowRight className="h-3 w-3 ml-auto" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Analyses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Analyses</CardTitle>
        </CardHeader>
        <CardContent>
          {analyses.length === 0 ? (
            <div className="text-center py-12">
              <FileBarChart className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">No analyses yet.</p>
              <p className="text-sm text-neutral-400 mt-1">
                Upload your first dataset to get started.
              </p>
              <Link href="/dashboard/analyze" className="mt-4 inline-block">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Analysis
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 font-medium text-neutral-500">File</th>
                    <th className="text-left py-3 font-medium text-neutral-500 hidden sm:table-cell">Status</th>
                    <th className="text-left py-3 font-medium text-neutral-500 hidden md:table-cell">Rows</th>
                    <th className="text-left py-3 font-medium text-neutral-500 hidden md:table-cell">Columns</th>
                    <th className="text-left py-3 font-medium text-neutral-500">Date</th>
                    <th className="text-right py-3 font-medium text-neutral-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {analyses.map((a) => (
                    <tr key={a.id} className="border-b border-neutral-100 last:border-0">
                      <td className="py-3 font-medium text-neutral-900 max-w-[200px] truncate">
                        {a.file_name}
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        <Badge
                          variant={
                            a.status === "completed"
                              ? "success"
                              : a.status === "failed"
                              ? "error"
                              : a.status === "processing"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {a.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-neutral-500 hidden md:table-cell">
                        {a.rows_count?.toLocaleString() || "—"}
                      </td>
                      <td className="py-3 text-neutral-500 hidden md:table-cell">
                        {a.columns_count || "—"}
                      </td>
                      <td className="py-3 text-neutral-500">
                        {formatDate(a.created_at)}
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/dashboard/analyses/${a.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
