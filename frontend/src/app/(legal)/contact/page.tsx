"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { CheckCircle, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const { error } = await supabase.from("contact_submissions").insert({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
    });

    if (error) {
      toast("error", "Failed to send message. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
  }

  return (
    <main className="container-app py-16 max-w-xl">
      <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
      <p className="text-neutral-500 mb-8">Have a question or need help? We&apos;d love to hear from you.</p>

      {submitted ? (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-success-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Message Sent</h2>
          <p className="text-neutral-500">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" name="name" required placeholder="Your name" />
          <Input label="Email" name="email" type="email" required placeholder="you@example.com" />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Message</label>
            <textarea name="message" rows={5} required placeholder="How can we help?"
              className="flex w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
          </div>
          <Button type="submit" loading={loading} className="gap-2">
            <Send className="h-4 w-4" /> Send Message
          </Button>
        </form>
      )}
    </main>
  );
}
