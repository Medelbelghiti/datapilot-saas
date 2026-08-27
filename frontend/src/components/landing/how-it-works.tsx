import { Upload, BarChart3, Brain, FileText } from "lucide-react";

const STEPS = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Your Data",
    desc: "Drag and drop a CSV or Excel file. Your data stays encrypted and private.",
  },
  {
    icon: BarChart3,
    step: "02",
    title: "Automated Analysis",
    desc: "We generate statistics, distributions, correlations, and outlier detection.",
  },
  {
    icon: Brain,
    step: "03",
    title: "AI Insights",
    desc: "GPT-4o summarizes key findings and gives actionable recommendations.",
  },
  {
    icon: FileText,
    step: "04",
    title: "Export & Report",
    desc: "Download professional PDF reports and interactive charts.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="container-app py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
        <p className="mt-3 text-neutral-600 dark:text-neutral-300">
          From raw file to actionable insights in seconds.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-4">
        {STEPS.map((s, i) => (
          <div key={i} className="relative rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                <s.icon className="h-5 w-5" />
              </div>
              <span className="text-4xl font-bold text-neutral-100 dark:text-neutral-800">{s.step}</span>
            </div>
            <h3 className="font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
