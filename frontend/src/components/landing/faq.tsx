"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "What file types can I upload?",
    a: "Free plan supports CSV. Pro and Business plans add Excel (.xlsx and .xls) files with larger size limits.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Your files are stored in encrypted private cloud storage and are only accessible to your account. We never share your data.",
  },
  {
    q: "How do AI insights work?",
    a: "We send your data's statistical summary (not raw rows) to OpenAI's GPT-4o model, which generates an executive summary, key findings, and recommendations.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. You can manage or cancel your subscription from the billing page at any time.",
  },
  {
    q: "What happens when I reach my analysis limit?",
    a: "You'll see a notice prompting you to upgrade. Your data is never lost — just upgrade to continue analyzing.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="container-app py-20 max-w-3xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
        <p className="mt-3 text-neutral-600 dark:text-neutral-300">
          Everything you need to know.
        </p>
      </div>
      <div className="space-y-3">
        {FAQS.map((f, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
            >
              <span className="font-medium">{f.q}</span>
              <ChevronDown
                className={cn("h-5 w-5 shrink-0 text-neutral-400 transition-transform", open === i && "rotate-180")}
              />
            </button>
            {open === i && (
              <div className="px-5 pb-5 text-sm text-neutral-600 dark:text-neutral-300">
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
