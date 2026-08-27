import { LineChart, Target, TrendingUp } from "lucide-react";

const CASES = [
  {
    icon: TrendingUp,
    title: "Marketing Analytics",
    desc: "Measure campaign performance and find what drives conversion.",
  },
  {
    icon: Target,
    title: "Financial Reporting",
    desc: "Automate recurring financial summaries and variance analysis.",
  },
  {
    icon: LineChart,
    title: "Operations & Logistics",
    desc: "Spot inefficiencies and outliers in supply chain data.",
  },
];

export function UseCases() {
  return (
    <section className="container-app py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">Built For Every Analyst</h2>
        <p className="mt-3 text-neutral-600 dark:text-neutral-300">
          From startups to enterprises, turn raw exports into clear direction.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {CASES.map((c, i) => (
          <div key={i} className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-brand-50 p-8 dark:border-neutral-800 dark:from-neutral-900 dark:to-brand-950/20">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
              <c.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">{c.title}</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
