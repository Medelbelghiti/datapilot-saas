"use client";

import Link from "next/link";
import { BarChart3, Sparkles, Upload, FileSearch, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-brand-50 to-white dark:from-brand-950/30 dark:to-neutral-950" />
      <div className="container-app relative py-20 md:py-28 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300 mb-6">
          <Sparkles className="h-4 w-4" />
          AI-Powered Data Analysis
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl md:text-6xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Turn Your Data Into <span className="text-gradient">Decisions</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">
          Upload a CSV or Excel file and get instant automated statistics,
          visualizations, correlations, and AI-powered insights — without writing
          a single line of code.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Start Free Analysis
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Log In
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            { icon: Upload, title: "Upload", desc: "Drop in CSV or Excel files instantly." },
            { icon: FileSearch, title: "Analyze", desc: "Automated statistics and data quality." },
            { icon: LineChart, title: "Decide", desc: "Visualize and act on AI insights." },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-6 text-left dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
