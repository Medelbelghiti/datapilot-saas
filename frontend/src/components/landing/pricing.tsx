"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Plan {
  name: string;
  price: string;
  interval: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  plan: "free" | "pro" | "business";
}

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    interval: "/month",
    description: "For getting started with your first analyses.",
    features: [
      "2 analyses / month",
      "CSV files only",
      "Basic statistics",
      "Data quality scoring",
    ],
    cta: "Start Free",
    plan: "free",
  },
  {
    name: "Pro",
    price: "$15",
    interval: "/month",
    description: "For analysts who need deeper insights.",
    features: [
      "50 analyses / month",
      "CSV + Excel",
      "AI insights",
      "PDF reports",
      "All visualizations",
    ],
    cta: "Get Pro",
    popular: true,
    plan: "pro",
  },
  {
    name: "Business",
    price: "$39",
    interval: "/month",
    description: "For teams with heavy analysis needs.",
    features: [
      "250 analyses / month",
      "All file types",
      "Priority processing",
      "API access",
      "Advanced support",
    ],
    cta: "Get Business",
    plan: "business",
  },
];

export function Pricing() {
  const router = useRouter();

  async function handleChoose(plan: Plan) {
    if (plan.plan === "free") {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      router.push(user ? "/dashboard" : "/signup");
      return;
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      router.push(`/dashboard/billing?plan=${plan.plan}`);
    } else {
      router.push(`/signup?plan=${plan.plan}`);
    }
  }

  return (
    <section id="pricing" className="bg-neutral-50 py-20 dark:bg-neutral-900/50">
      <div className="container-app">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Simple, Transparent Pricing</h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-300">
            Start free. Upgrade when you need more power.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border bg-white p-8 dark:bg-neutral-900 ${
                plan.popular
                  ? "border-brand-500 shadow-xl ring-2 ring-brand-500/20 dark:border-brand-500"
                  : "border-neutral-200 dark:border-neutral-800"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-neutral-500">{plan.interval}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-success-600 mt-0.5 shrink-0" />
                    <span className="text-neutral-600 dark:text-neutral-300">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8 w-full"
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handleChoose(plan)}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-neutral-500">
          Need a custom plan?{" "}
          <Link href="/contact" className="text-brand-600 hover:underline">Contact us</Link>
        </p>
      </div>
    </section>
  );
}
