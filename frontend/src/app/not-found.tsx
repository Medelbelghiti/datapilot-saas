import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { HelpCircle, MessageSquare, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="container-app py-20 text-center">
        <HelpCircle className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
        <p className="text-neutral-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button className="gap-2">
            Go Home
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </main>
      <Footer />
    </>
  );
}
