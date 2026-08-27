"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="lg:ml-64">
        <main className="p-4 pt-16 lg:pt-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
