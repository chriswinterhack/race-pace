"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface WaitlistFormProps {
  variant?: "hero" | "footer";
  source?: string;
}

export function WaitlistForm({ variant = "hero", source = "homepage" }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });

      const result = await response.json();

      if (result.success) {
        setSubscribed(true);
        setEmail("");
        toast.success(result.message);
      } else {
        toast.error(result.error || "Something went wrong");
      }
    } catch {
      toast.error("Failed to join waitlist. Please try again.");
    }
    setLoading(false);
  }

  if (subscribed) {
    return (
      <div className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <Check className="h-5 w-5 text-emerald-400" />
        <span className="text-emerald-300 font-medium">
          You&apos;re on the list! We&apos;ll be in touch.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="flex-1 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-sky-500/50 focus:border-brand-sky-500/50 transition-all"
      />
      <button
        type="submit"
        disabled={loading}
        className="group inline-flex items-center gap-2 px-6 py-3.5 font-semibold text-brand-navy-900 bg-brand-sky-400 rounded-xl hover:bg-brand-sky-300 transition-all duration-200 shadow-lg shadow-brand-sky-500/25 hover:shadow-brand-sky-500/40 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : variant === "hero" ? (
          <>
            Join Waitlist
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        ) : (
          <>
            Join
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
