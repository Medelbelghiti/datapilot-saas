import Link from "next/link";
import { BarChart3 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="container-app py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              DataPilot AI
            </Link>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
              Turn your data into decisions with automated analysis and AI insights.
            </p>
          </div>

          <div>
            <h4 className="mb-3 font-semibold text-sm">Product</h4>
            <ul className="space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
              <li><Link href="#features" className="hover:text-neutral-900 dark:hover:text-white">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-neutral-900 dark:hover:text-white">Pricing</Link></li>
              <li><Link href="/dashboard" className="hover:text-neutral-900 dark:hover:text-white">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-semibold text-sm">Resources</h4>
            <ul className="space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
              <li><Link href="/methodology" className="hover:text-neutral-900 dark:hover:text-white">Methodology</Link></li>
              <li><Link href="/contact" className="hover:text-neutral-900 dark:hover:text-white">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-semibold text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
              <li><Link href="/privacy" className="hover:text-neutral-900 dark:hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-neutral-900 dark:hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-100 pt-6 text-center text-sm text-neutral-400 dark:border-neutral-800">
          © {new Date().getFullYear()} DataPilot AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
