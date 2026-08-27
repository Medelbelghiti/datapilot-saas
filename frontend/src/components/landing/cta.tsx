"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="container-app py-20">
      <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-brand-800 px-8 py-16 text-center text-white">
        <h2 className="mx-auto max-w-2xl text-3xl md:text-4xl font-bold">
          Ready to Understand Your Data?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-brand-100">
          Upload your first dataset and get AI-powered insights in seconds. No credit card required.
        </p>
        <Link href="/signup" className="mt-8 inline-block">
          <Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50 gap-2">
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
