"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Report } from "@/types";
import { formatDate } from "@/lib/utils-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("reports")
        .select("*, analyses!inner(file_name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setReports(data as any);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Reports</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-neutral-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">No reports generated yet.</p>
            <p className="text-sm text-neutral-400 mt-1">
              Generate a report from any analysis.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-200"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="font-medium text-sm">{(r as any).analyses?.file_name || "Report"}</p>
                  <p className="text-xs text-neutral-500">{formatDate(r.created_at)}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(r.file_path, "_blank")}>
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
