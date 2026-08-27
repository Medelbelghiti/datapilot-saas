"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Plus, Search, Trash2, FileBarChart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Analysis } from "@/types";
import { formatDate } from "@/lib/utils-helpers";

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setAnalyses(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("analyses").delete().eq("id", deleteId);
    if (!error) {
      setAnalyses((prev) => prev.filter((a) => a.id !== deleteId));
      toast("success", "Analysis deleted.");
    } else {
      toast("error", "Failed to delete analysis.");
    }
    setDeleting(false);
    setDeleteId(null);
  }

  const filtered = analyses.filter((a) =>
    a.file_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Analysis"
        description="This will permanently delete this analysis and all its results. This cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Analyses</h1>
        <Link href="/dashboard/analyze">
          <Button className="gap-2"><Plus className="h-4 w-4" /> New Analysis</Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input placeholder="Search analyses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? <SkeletonTable rows={5} /> : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileBarChart className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">{search ? "No analyses match your search." : "No analyses yet."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4 min-w-0">
                <FileBarChart className="h-5 w-5 text-neutral-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{a.file_name}</p>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Badge variant={a.status === "completed" ? "success" : a.status === "failed" ? "error" : "warning"} className="text-[10px]">{a.status}</Badge>
                    <span>{formatDate(a.created_at)}</span>
                    {a.rows_count && <span>{a.rows_count.toLocaleString()} rows</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/analyses/${a.id}`}><Button variant="ghost" size="sm">View</Button></Link>
                <Button variant="ghost" size="icon" className="text-error-500 hover:text-error-600" onClick={() => setDeleteId(a.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
