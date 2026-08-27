import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "DataPilot AI — AI-Powered Data Analysis",
  description:
    "Analyze Excel and CSV files with automated statistics, visualizations, AI insights, and professional reports.",
  keywords: ["data analysis", "AI", "CSV", "Excel", "analytics", "insights"],
  openGraph: {
    title: "DataPilot AI — Turn Your Data Into Decisions",
    description:
      "Upload your data, get instant analysis, visualizations, and AI-powered insights.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-neutral-950 dark:text-neutral-100">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
