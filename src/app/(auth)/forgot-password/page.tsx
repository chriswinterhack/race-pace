"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, Mountain, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-navy-50 via-white to-brand-sky-50 p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-10 group justify-center">
          <Mountain className="h-8 w-8 text-brand-sky-500 transition-transform duration-300 group-hover:scale-110" />
          <span className="text-2xl font-heading font-bold text-brand-navy-900 tracking-tight">
            Final<span className="text-brand-sky-500">Climb</span>
          </span>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl shadow-brand-navy-900/5 border border-brand-navy-100 p-8">
          {sent ? (
            // Success state
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-brand-navy-900 mb-2">
                Check your email
              </h1>
              <p className="text-brand-navy-500 mb-6">
                We sent a password reset link to<br />
                <span className="font-medium text-brand-navy-700">{email}</span>
              </p>
              <p className="text-sm text-brand-navy-400 mb-6">
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-brand-sky-600 hover:text-brand-sky-700 font-medium"
                >
                  try again
                </button>
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full rounded-xl h-11">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            // Form state
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-heading font-bold text-brand-navy-900 mb-2">
                  Reset your password
                </h1>
                <p className="text-brand-navy-500">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-brand-navy-700 font-medium">
                    Email address
                  </Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 rounded-xl border-brand-navy-200 focus:border-brand-sky-500 focus:ring-brand-sky-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-brand-sky-500 hover:bg-brand-sky-600 text-white font-semibold text-base shadow-lg shadow-brand-sky-500/25 transition-all hover:shadow-xl hover:shadow-brand-sky-500/30"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm text-brand-navy-500 hover:text-brand-navy-700 font-medium"
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
