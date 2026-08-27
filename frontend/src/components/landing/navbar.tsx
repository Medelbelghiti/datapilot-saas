"use client";

import Link from "next/link";
import { useState } from "react";
import { BarChart3, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [open, setOpen] = useState(false);

  async function handleGetStarted() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/signup";
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-lg dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          DataPilot AI
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600 dark:text-neutral-300">
          <Link href="#how-it-works" className="hover:text-neutral-900 dark:hover:text-white">How it works</Link>
          <Link href="#features" className="hover:text-neutral-900 dark:hover:text-white">Features</Link>
          <Link href="#pricing" className="hover:text-neutral-900 dark:hover:text-white">Pricing</Link>
          <Link href="#faq" className="hover:text-neutral-900 dark:hover:text-white">FAQ</Link>
          <Link href="/contact" className="hover:text-neutral-900 dark:hover:text-white">Contact</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Log In</Button>
          </Link>
          <Button onClick={handleGetStarted}>Get Started</Button>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-neutral-600 dark:text-neutral-300">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 px-4 py-4 space-y-3">
          <Link href="#how-it-works" onClick={() => setOpen(false)} className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">How it works</Link>
          <Link href="#features" onClick={() => setOpen(false)} className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Features</Link>
          <Link href="#pricing" onClick={() => setOpen(false)} className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Pricing</Link>
          <Link href="#faq" onClick={() => setOpen(false)} className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">FAQ</Link>
          <div className="flex gap-2 pt-2">
            <Link href="/login" className="flex-1"><Button variant="outline" className="w-full">Log In</Button></Link>
            <Link href="/signup" className="flex-1"><Button className="w-full">Sign Up</Button></Link>
          </div>
        </div>
      )}
    </header>
  );
}
