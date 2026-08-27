"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Upload, File, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatFileSize } from "@/lib/utils-helpers";

const ACCEPTED_TYPES: Record<string, string[]> = {
  "text/csv": [".csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
};

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<"idle" | "uploading" | "processing" | "completed" | "failed">("idle");
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const onDrop = useCallback((accepted: File[]) => {
    setError("");
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED_TYPES, maxFiles: 1, multiple: false,
  });

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setProgress("uploading");
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: sub } = await supabase.from("subscriptions").select("plan").eq("user_id", user.id).single();
      const plan: "free" | "pro" | "business" = (sub?.plan as "free" | "pro" | "business") || "free";

      if (plan === "free" && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
        throw new Error("Excel files require a Pro plan. Please upgrade.");
      }

      const maxSize = { free: 5 * 1024 * 1024, pro: 50 * 1024 * 1024, business: 200 * 1024 * 1024 }[plan] || 5 * 1024 * 1024;
      if (file.size > maxSize) throw new Error(`File too large. Max for ${plan}: ${formatFileSize(maxSize)}.`);

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const { data: usageData } = await supabase.from("usage").select("analysis_count").eq("user_id", user.id).eq("period_start", periodStart).single();
      const limits: Record<string, number> = { free: 2, pro: 50, business: 250 };
      if ((usageData?.analysis_count || 0) >= (limits[plan] || 2)) {
        throw new Error("Monthly limit reached. Upgrade to continue.");
      }

      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("datasets").upload(filePath, file);
      if (uploadError) throw new Error("Upload failed.");

      setProgress("processing");

      const { data: analysis, error: insertError } = await supabase
        .from("analyses").insert({ user_id: user.id, file_name: file.name, file_path: filePath, file_size: file.size, file_type: file.type || "text/csv", status: "processing" })
        .select().single();
      if (insertError) throw new Error("Failed to create analysis.");

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("analysis_id", analysis.id);

      const res = await fetch(`${backendUrl}/api/analyses`, { method: "POST", body: formData });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ detail: "Analysis failed" }));
        throw new Error(errBody.detail || "Analysis failed");
      }

      setProgress("completed");
      toast("success", "Analysis complete!");
      setTimeout(() => router.push(`/dashboard/analyses/${analysis.id}`), 1500);
    } catch (err: any) {
      setProgress("failed");
      setError(err.message || "Something went wrong");
      toast("error", err.message || "Analysis failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">New Analysis</h1>
          <p className="text-sm text-neutral-500">Upload a CSV or Excel file to get started.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-error-50 border border-error-200 p-4 text-sm text-error-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {progress === "completed" ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-success-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Analysis Complete!</h2>
            <p className="text-neutral-500">Redirecting to results...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Upload File</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-brand-500 bg-brand-50" : file ? "border-success-300 bg-success-50" : "border-neutral-300 hover:border-neutral-400"
              }`}>
              <input {...getInputProps()} />
              {file ? (
                <div className="space-y-2">
                  <File className="h-10 w-10 text-success-600 mx-auto" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-neutral-500">{formatFileSize(file.size)}</p>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); setError(""); }} className="text-sm text-error-600 hover:underline">Remove</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 text-neutral-400 mx-auto" />
                  <p className="font-medium">Drag and drop your file here</p>
                  <p className="text-sm text-neutral-500">or click to browse. CSV and Excel (.xlsx) supported.</p>
                </div>
              )}
            </div>
            <Button onClick={handleUpload} disabled={!file || uploading} loading={uploading || progress === "processing"} className="w-full">
              {progress === "uploading" ? "Uploading..." : progress === "processing" ? "Analyzing your data..." : "Upload & Analyze"}
            </Button>
          </CardContent>
        </Card>
      )}

      {(uploading || progress === "processing") && (
        <Card>
          <CardContent className="py-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">{progress === "uploading" ? "Uploading file..." : "Analyzing dataset..."}</span>
              </div>
              <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${progress === "processing" ? "w-full" : "w-3/4"} bg-brand-500`} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
