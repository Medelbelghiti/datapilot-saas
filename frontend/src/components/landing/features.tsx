import {
  Database,
  Gauge,
  GitCompareArrows,
  AlertTriangle,
  LineChart,
  FileText,
} from "lucide-react";

const FEATURES = [
  {
    icon: Gauge,
    title: "Data Quality Scoring",
    desc: "Instant health score for your dataset with missing values and type detection.",
  },
  {
    icon: Database,
    title: "Comprehensive Statistics",
    desc: "Mean, median, standard deviation, distributions, and more for every column.",
  },
  {
    icon: GitCompareArrows,
    title: "Correlation Analysis",
    desc: "Identify relationships between variables with automatically-ranked strengths.",
  },
  {
    icon: AlertTriangle,
    title: "Outlier Detection",
    desc: "Statistical methods surface anomalies that could skew your decisions.",
  },
  {
    icon: LineChart,
    title: "Beautiful Visualizations",
    desc: "Histograms, box plots, and bar charts generated automatically for you.",
  },
  {
    icon: FileText,
    title: "PDF Reports",
    desc: "Professional, branded reports you can share with your team instantly.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-neutral-50 py-20 dark:bg-neutral-900/50">
      <div className="container-app">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Everything You Need</h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-300">
            A complete toolkit for understanding your data, automated end-to-end.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
