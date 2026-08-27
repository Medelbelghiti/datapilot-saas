"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils-helpers";
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  X,
  Loader2,
} from "lucide-react";
import { Plan } from "@/types";

const PLAN_DETAILS: Record<
  string,
  { name: string; price: string; interval: string; features: string[] }
> = {
  free: {
    name: "Free",
    price: "$0",
    interval: "/month",
    features: ["2 analyses/month", "CSV only", "Basic statistics"],
  },
  pro: {
    name: "Pro",
    price: "$15",
    interval: "/month",
    features: [
      "50 analyses/month",
      "CSV + Excel",
      "AI insights",
      "PDF reports",
    ],
  },
  business: {
    name: "Business",
    price: "$39",
    interval: "/month",
    features: [
      "250 analyses/month",
      "All file types",
      "Priority processing",
      "API access",
    ],
  },
};

function BillingContent() {
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");

  const [plan, setPlan] = useState<Plan>("free");
  const [status, setStatus] = useState("active");
  const [usage, setUsage] = useState(0);
  const [limit, setLimit] = useState(2);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || "";

      const [subRes, usageRes] = await Promise.all([
        fetch(`${backendUrl}/api/subscription`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
        fetch(`${backendUrl}/api/usage`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
      ]);

      if (subRes.plan) setPlan(subRes.plan);
      if (subRes.status) setStatus(subRes.status);
      if (subRes.current_period_end)
        setPeriodEnd(subRes.current_period_end);
      if (subRes.cancel_at_period_end !== undefined)
        setCancelAtPeriodEnd(subRes.cancel_at_period_end);

      if (usageRes.usage_count !== undefined) setUsage(usageRes.usage_count);
      if (usageRes.limit !== undefined) setLimit(usageRes.limit);
    } catch (err) {
      console.error("Failed to load billing data:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (checkoutStatus === "success") {
      toast(
        "success",
        "Payment received! Your plan will be updated within a few seconds."
      );
      const timer = setTimeout(() => loadData(), 3000);
      return () => clearTimeout(timer);
    }
  }, [checkoutStatus, loadData, toast]);

  async function handleCheckout(productId: string, planName: string) {
    setCheckoutLoading(planName);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast("error", "Please log in to upgrade.");
        return;
      }

      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || "";

      const res = await fetch(`${backendUrl}/api/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to create checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast("error", err.message || "Checkout failed. Please try again.");
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || "";

      const res = await fetch(`${backendUrl}/api/customer-portal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to open portal");
      }

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast("error", err.message || "Failed to open customer portal");
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleCancel() {
    if (
      !window.confirm(
        "Are you sure you want to cancel? You will lose access at the end of your billing period."
      )
    ) {
      return;
    }

    setCancelLoading(true);
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || "";

      const subRes = await fetch(`${backendUrl}/api/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subData = await subRes.json();

      if (!subData.polar_subscription_id) {
        throw new Error("No active subscription found");
      }

      const portalRes = await fetch(`${backendUrl}/api/customer-portal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const portalData = await portalRes.json();

      if (portalData.url) {
        toast(
          "info",
          "Opening customer portal to manage your subscription..."
        );
        window.open(portalData.url, "_blank");
      }
    } catch (err: any) {
      toast("error", err.message || "Failed to cancel subscription");
    } finally {
      setCancelLoading(false);
    }
  }

  const usagePct = Math.min((usage / limit) * 100, 100);
  const isPaid = plan !== "free";
  const planDetails = PLAN_DETAILS[plan] || PLAN_DETAILS.free;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-2xl">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-48" />
        <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
        <div className="h-48 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold">Billing & Subscription</h1>

      {checkoutStatus === "success" && (
        <div className="rounded-lg bg-success-50 border border-success-200 p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-success-800">
              Payment received!
            </p>
            <p className="text-sm text-success-700 mt-1">
              Your plan is being updated. This usually takes a few seconds.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">{planDetails.name}</span>
              <Badge
                variant={
                  isPaid
                    ? status === "active"
                      ? "default"
                      : "warning"
                    : "secondary"
                }
              >
                {status === "active"
                  ? "Active"
                  : status === "canceled"
                  ? "Canceled"
                  : status}
              </Badge>
              {cancelAtPeriodEnd && (
                <Badge variant="warning">
                  Cancels {periodEnd ? formatDate(periodEnd) : "soon"}
                </Badge>
              )}
            </div>
            <span className="text-lg text-neutral-500">
              {planDetails.price}
              <span className="text-sm">{planDetails.interval}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-500">Analyses Used</p>
              <p className="font-semibold">
                {usage} / {limit}
              </p>
              <div className="mt-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usagePct > 80
                      ? "bg-error-500"
                      : usagePct > 50
                      ? "bg-warning-500"
                      : "bg-brand-500"
                  }`}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            </div>
            {periodEnd && (
              <div>
                <p className="text-neutral-500">
                  {cancelAtPeriodEnd ? "Access Until" : "Next Renewal"}
                </p>
                <p className="font-semibold">{formatDate(periodEnd)}</p>
              </div>
            )}
          </div>

          {isPaid && (
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePortal}
                loading={portalLoading}
                className="gap-2"
              >
                <ExternalLink className="h-3 w-3" />
                Manage Subscription
              </Button>
              {!cancelAtPeriodEnd && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  loading={cancelLoading}
                  className="text-error-600 hover:text-error-700 gap-2"
                >
                  <X className="h-3 w-3" />
                  Cancel Plan
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!isPaid && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-neutral-500">
              Get more analyses, AI insights, PDF reports, and Excel support.
            </p>

            <div className="grid gap-3">
              <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-brand-300 transition-colors">
                <div>
                  <p className="font-semibold">Pro Monthly</p>
                  <p className="text-sm text-neutral-500">
                    $15/month — 50 analyses, AI, PDF
                  </p>
                </div>
                <Button
                  onClick={() =>
                    handleCheckout(
                      process.env.NEXT_PUBLIC_PRO_MONTHLY_ID || "",
                      "pro-monthly"
                    )
                  }
                  loading={checkoutLoading === "pro-monthly"}
                  size="sm"
                >
                  {checkoutLoading === "pro-monthly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-brand-200 bg-brand-50 dark:bg-brand-950/20">
                <div>
                  <p className="font-semibold">Pro Yearly</p>
                  <p className="text-sm text-neutral-500">
                    $150/year — Save 2 months
                  </p>
                </div>
                <Button
                  onClick={() =>
                    handleCheckout(
                      process.env.NEXT_PUBLIC_PRO_YEARLY_ID || "",
                      "pro-yearly"
                    )
                  }
                  loading={checkoutLoading === "pro-yearly"}
                  size="sm"
                >
                  {checkoutLoading === "pro-yearly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <div>
                  <p className="font-semibold">Business</p>
                  <p className="text-sm text-neutral-500">
                    $39/month — 250 analyses, API access
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleCheckout(
                      process.env.NEXT_PUBLIC_BUSINESS_ID || "",
                      "business"
                    )
                  }
                  loading={checkoutLoading === "business"}
                  size="sm"
                >
                  {checkoutLoading === "business" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isPaid && !cancelAtPeriodEnd && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Included in {planDetails.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {planDetails.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success-600 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {cancelAtPeriodEnd && (
        <Card className="border-warning-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Your subscription is cancelled</p>
                <p className="text-sm text-neutral-500 mt-1">
                  You will retain access until{" "}
                  {periodEnd ? formatDate(periodEnd) : "the end of your billing period"}.
                  After that, you will be downgraded to the Free plan.
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() =>
                    handleCheckout(
                      plan === "pro"
                        ? process.env.NEXT_PUBLIC_PRO_MONTHLY_ID || ""
                        : process.env.NEXT_PUBLIC_BUSINESS_ID || "",
                      "resubscribe"
                    )
                  }
                  loading={checkoutLoading === "resubscribe"}
                >
                  Resubscribe
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-neutral-400">
          Loading...
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
