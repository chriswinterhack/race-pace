"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, Mountain, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Check if we have a valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Invalid or expired reset link. Please request a new one.");
      }
    };
    checkSession();
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success("Password updated successfully!");

      // Redirect to dashboard after a moment
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
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
          {error ? (
            // Error state
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-brand-navy-900 mb-2">
                Link expired
              </h1>
              <p className="text-brand-navy-500 mb-6">
                {error}
              </p>
              <Link href="/forgot-password">
                <Button className="w-full rounded-xl h-11 bg-brand-sky-500 hover:bg-brand-sky-600">
                  Request new link
                </Button>
              </Link>
            </div>
          ) : success ? (
            // Success state
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-brand-navy-900 mb-2">
                Password updated
              </h1>
              <p className="text-brand-navy-500 mb-6">
                Your password has been reset successfully.
                <br />
                Redirecting you to your dashboard...
              </p>
              <Loader2 className="h-6 w-6 animate-spin text-brand-sky-500 mx-auto" />
            </div>
          ) : (
            // Form state
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-heading font-bold text-brand-navy-900 mb-2">
                  Set new password
                </h1>
                <p className="text-brand-navy-500">
                  Choose a strong password for your account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="password" className="text-brand-navy-700 font-medium">
                    New password
                  </Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 h-12 rounded-xl border-brand-navy-200 focus:border-brand-sky-500 focus:ring-brand-sky-500"
                      required
                      minLength={8}
                      disabled={loading}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-brand-navy-400">
                    Must be at least 8 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-brand-navy-700 font-medium">
                    Confirm password
                  </Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-11 h-12 rounded-xl border-brand-navy-200 focus:border-brand-sky-500 focus:ring-brand-sky-500"
                      required
                      minLength={8}
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
                    "Update password"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
