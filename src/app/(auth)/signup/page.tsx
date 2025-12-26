"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Gift, CheckCircle } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { toast } from "sonner";

interface InviteInfo {
  valid: boolean;
  email?: string;
  grantsPremium?: boolean;
  premiumDays?: number;
  reason?: string;
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [checkingInvite, setCheckingInvite] = useState(false);

  // Check invite code on mount
  useEffect(() => {
    if (inviteCode) {
      checkInviteCode(inviteCode);
    }
  }, [inviteCode]);

  async function checkInviteCode(code: string) {
    setCheckingInvite(true);
    try {
      const response = await fetch(`/api/invite/${code}`);
      const data = await response.json();
      setInviteInfo(data);

      // Pre-fill email if invite is valid
      if (data.valid && data.email) {
        setEmail(data.email);
      }
    } catch (err) {
      console.error("Error checking invite:", err);
      setInviteInfo({ valid: false, reason: "error" });
    }
    setCheckingInvite(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          inviteCode: inviteInfo?.valid ? inviteCode : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Signup failed");
        setLoading(false);
        return;
      }

      // Show success message based on invite result
      if (result.data?.invite?.grantedPremium) {
        toast.success("Account created with Premium access!");
      } else {
        toast.success("Account created successfully!");
      }

      // Check if email confirmation is needed
      if (result.data?.needsEmailConfirmation) {
        router.push("/login?message=check-email");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Something went wrong. Please try again.");
    }

    setLoading(false);
  }

  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-brand-navy-900">
            Create your account
          </h1>
          <p className="mt-2 text-brand-navy-600">
            Start planning your next race
          </p>
        </div>

        {/* Invite Banner */}
        {checkingInvite ? (
          <div className="mb-6 p-4 bg-brand-sky-50 border border-brand-sky-200 rounded-xl flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-brand-sky-500" />
            <span className="text-brand-sky-700">Checking invite code...</span>
          </div>
        ) : inviteInfo?.valid && inviteInfo.grantsPremium ? (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Gift className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-900">
                  You&apos;ve been invited!
                </p>
                <p className="text-sm text-emerald-700 mt-1">
                  Sign up to receive {inviteInfo.premiumDays && inviteInfo.premiumDays >= 36500
                    ? "lifetime"
                    : inviteInfo.premiumDays && inviteInfo.premiumDays >= 365
                      ? `${Math.floor(inviteInfo.premiumDays / 365)} year${inviteInfo.premiumDays >= 730 ? "s" : ""}`
                      : `${inviteInfo.premiumDays} days`} of free Premium access.
                </p>
              </div>
            </div>
          </div>
        ) : inviteInfo && !inviteInfo.valid ? (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800">
              {inviteInfo.reason === "expired"
                ? "This invite link has expired."
                : inviteInfo.reason === "used"
                  ? "This invite has already been used."
                  : "Invalid invite link. You can still create an account."}
            </p>
          </div>
        ) : null}

        <div className="bg-white rounded-xl shadow-card border border-brand-navy-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={inviteInfo?.valid && !!inviteInfo.email}
              />
              {inviteInfo?.valid && inviteInfo.email && (
                <p className="text-xs text-brand-navy-500 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                  Email from invite
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2 bg-brand-navy-900 hover:bg-brand-navy-800"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="mt-4 text-xs text-center text-brand-navy-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-brand-navy-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-brand-sky-500 hover:text-brand-sky-600"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-sky-500" />
        </main>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
