"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileBarChart, DollarSign, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils-helpers";

interface AdminStats {
  totalUsers: number;
  totalAnalyses: number;
  completedAnalyses: number;
  failedAnalyses: number;
  freeUsers: number;
  proUsers: number;
  businessUsers: number;
}

interface UserData {
  email: string;
  name: string;
  plan: string;
  analyses: number;
  created_at: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check admin role via user metadata
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",");
      if (!adminEmails.includes(user.email || "")) {
        setLoading(false);
        return;
      }
      setIsAdmin(true);

      // Fetch stats
      const [usersRes, analysesRes, subsRes, errorsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, name, created_at"),
        supabase.from("analyses").select("id, user_id, status, created_at"),
        supabase.from("subscriptions").select("user_id, plan"),
        supabase.from("analyses").select("id, file_name, error_message, created_at").eq("status", "failed").order("created_at", { ascending: false }).limit(20),
      ]);

      const profiles = usersRes.data || [];
      const analyses = analysesRes.data || [];
      const subs = subsRes.data || [];

      const planCounts = { free: 0, pro: 0, business: 0 };
      subs.forEach((s) => {
        planCounts[s.plan as keyof typeof planCounts] = (planCounts[s.plan as keyof typeof planCounts] || 0) + 1;
      });

      const analysesByUser: Record<string, number> = {};
      analyses.forEach((a) => {
        analysesByUser[a.user_id] = (analysesByUser[a.user_id] || 0) + 1;
      });

      setStats({
        totalUsers: profiles.length,
        totalAnalyses: analyses.length,
        completedAnalyses: analyses.filter((a) => a.status === "completed").length,
        failedAnalyses: analyses.filter((a) => a.status === "failed").length,
        freeUsers: planCounts.free,
        proUsers: planCounts.pro,
        businessUsers: planCounts.business,
      });

      const usersWithEmails = profiles.map((p) => ({
        email: "—",
        name: p.name || "—",
        plan: subs.find((s) => s.user_id === p.user_id)?.plan || "free",
        analyses: analysesByUser[p.user_id] || 0,
        created_at: p.created_at,
      }));
      setUsers(usersWithEmails);
      setErrors(errorsRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="h-64 bg-neutral-200 rounded-xl animate-pulse" />;
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-12 w-12 text-error-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-neutral-500 mt-2">You don&apos;t have admin access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {stats && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-brand-600" />
                <div>
                  <p className="text-xs text-neutral-500">Total Users</p>
                  <p className="text-xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileBarChart className="h-5 w-5 text-success-600" />
                <div>
                  <p className="text-xs text-neutral-500">Analyses</p>
                  <p className="text-xl font-bold">{stats.totalAnalyses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-xs text-neutral-500">Paid Users</p>
                  <p className="text-xl font-bold">{stats.proUsers + stats.businessUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-error-600" />
                <div>
                  <p className="text-xs text-neutral-500">Failed Analyses</p>
                  <p className="text-xl font-bold">{stats.failedAnalyses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Plan Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats && [
              { label: "Free", count: stats.freeUsers, color: "bg-neutral-400" },
              { label: "Pro", count: stats.proUsers, color: "bg-brand-500" },
              { label: "Business", count: stats.businessUsers, color: "bg-amber-500" },
            ].map((p) => (
              <div key={p.label} className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${p.color}`} />
                <span className="text-sm flex-1">{p.label}</span>
                <span className="text-sm font-medium">{p.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-2 font-medium text-neutral-500">Name</th>
                  <th className="text-left py-2 font-medium text-neutral-500">Plan</th>
                  <th className="text-right py-2 font-medium text-neutral-500">Analyses</th>
                  <th className="text-left py-2 font-medium text-neutral-500">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={i} className="border-b border-neutral-100 last:border-0">
                    <td className="py-2">{u.name}</td>
                    <td className="py-2"><Badge variant={u.plan === "pro" ? "default" : "secondary"}>{u.plan}</Badge></td>
                    <td className="py-2 text-right">{u.analyses}</td>
                    <td className="py-2 text-neutral-500">{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Errors</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errors.map((e) => (
                <div key={e.id} className="p-3 rounded-lg bg-error-50 border border-error-200 text-sm">
                  <p className="font-medium text-error-700">{e.file_name}</p>
                  <p className="text-error-600 text-xs mt-1">{e.error_message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
