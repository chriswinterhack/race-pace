"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Gift, CheckCircle, MapPin, Mail, Lock, Mountain, ArrowRight, User } from "lucide-react";
import { Button, Input, Label, Skeleton } from "@/components/ui";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { US_STATES } from "@/lib/constants/us-states";

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
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);
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

      if (data.valid && data.email) {
        setEmail(data.email);
      }
    } catch (err) {
      console.error("Error checking invite:", err);
      setInviteInfo({ valid: false, reason: "error" });
    }
    setCheckingInvite(false);
  }

  const handleSocialSignup = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard${inviteCode ? `&invite=${inviteCode}` : ""}`,
        },
      });
      if (error) {
        toast.error(error.message);
        setSocialLoading(null);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setSocialLoading(null);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          password,
          city: city || undefined,
          state: state || undefined,
          inviteCode: inviteInfo?.valid ? inviteCode : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Signup failed");
        setLoading(false);
        return;
      }

      if (result.data?.invite?.grantedPremium) {
        toast.success("Account created with Premium access!");
      } else {
        toast.success("Account created successfully!");
      }

      if (result.data?.needsEmailConfirmation) {
        router.push("/login?message=check-email");
      } else {
        router.push("/dashboard");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-navy-950">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-900 via-brand-navy-950 to-black" />

        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-sky-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-sky-600/15 rounded-full blur-3xl animate-pulse delay-1000" />

        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Mountain className="h-8 w-8 text-brand-sky-400 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-2xl font-heading font-bold text-white tracking-tight">
              Final<span className="text-brand-sky-400">Climb</span>
            </span>
          </Link>

          {/* Hero text */}
          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-heading font-bold text-white leading-tight">
              Plan your race.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-sky-400 to-brand-sky-300">
                Race your plan.
              </span>
            </h1>
            <p className="text-lg text-brand-navy-300 max-w-md">
              Get personalized pacing, power targets, and nutrition timing for every mile of your next race.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {[
              "AI-powered race pacing strategy",
              "Real-time Garmin data fields",
              "Top tube stickers & PDF plans",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-sky-500/20 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-brand-sky-400" />
                </div>
                <span className="text-brand-navy-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-20 bg-white overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile logo */}
          <Link href="/" className="flex lg:hidden items-center gap-2.5 mb-8 group">
            <Mountain className="h-7 w-7 text-brand-sky-500 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xl font-heading font-bold text-brand-navy-900 tracking-tight">
              Final<span className="text-brand-sky-500">Climb</span>
            </span>
          </Link>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-brand-navy-900">
              Create your account
            </h2>
            <p className="mt-2 text-brand-navy-500">
              Start planning your next race in minutes
            </p>
          </div>

          {/* Invite Banner */}
          {checkingInvite ? (
            <div className="mb-6 p-4 bg-brand-sky-50 border border-brand-sky-200 rounded-xl flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-brand-sky-500" />
              <span className="text-brand-sky-700">Checking invite code...</span>
            </div>
          ) : inviteInfo?.valid && inviteInfo.grantsPremium ? (
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-brand-sky-50 border border-emerald-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Gift className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-900">
                    You&apos;ve been invited!
                  </p>
                  <p className="text-sm text-emerald-700 mt-0.5">
                    Get {inviteInfo.premiumDays && inviteInfo.premiumDays >= 36500
                      ? "lifetime"
                      : inviteInfo.premiumDays && inviteInfo.premiumDays >= 365
                        ? `${Math.floor(inviteInfo.premiumDays / 365)} year${inviteInfo.premiumDays >= 730 ? "s" : ""}`
                        : `${inviteInfo.premiumDays} days`} of free Premium access
                  </p>
                </div>
              </div>
            </div>
          ) : inviteInfo && !inviteInfo.valid ? (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800">
                {inviteInfo.reason === "expired"
                  ? "This invite has expired."
                  : inviteInfo.reason === "used"
                    ? "This invite has already been used."
                    : "Invalid invite link. You can still create an account."}
              </p>
            </div>
          ) : null}

          {/* Social Signup Buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => handleSocialSignup("google")}
              disabled={!!socialLoading || loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-brand-navy-200 bg-white text-brand-navy-700 font-medium hover:bg-brand-navy-50 hover:border-brand-navy-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === "google" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleSocialSignup("apple")}
              disabled={!!socialLoading || loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === "apple" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              )}
              Continue with Apple
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-navy-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-brand-navy-400">or sign up with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-brand-navy-700 font-medium">
                Email
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
                  disabled={loading || !!socialLoading || (inviteInfo?.valid && !!inviteInfo.email)}
                />
              </div>
              {inviteInfo?.valid && inviteInfo.email && (
                <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Email from invite
                </p>
              )}
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName" className="text-brand-navy-700 font-medium">
                  First name
                </Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400" />
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-11 h-12 rounded-xl border-brand-navy-200 focus:border-brand-sky-500 focus:ring-brand-sky-500"
                    disabled={loading || !!socialLoading}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="lastName" className="text-brand-navy-700 font-medium">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-12 mt-1.5 rounded-xl border-brand-navy-200 focus:border-brand-sky-500 focus:ring-brand-sky-500"
                  disabled={loading || !!socialLoading}
                />
              </div>
            </div>

            {/* Location Fields */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-navy-500" />
                <Label className="text-brand-navy-700 font-medium">Location <span className="font-normal text-brand-navy-400">(optional)</span></Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="city"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-12 rounded-xl border-brand-navy-200 focus:border-brand-sky-500 focus:ring-brand-sky-500"
                  disabled={loading || !!socialLoading}
                />
                <select
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  disabled={loading || !!socialLoading}
                  className="h-12 rounded-xl border border-brand-navy-200 bg-white px-3 text-sm text-brand-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-sky-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">State</option>
                  {US_STATES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="password" className="text-brand-navy-700 font-medium">
                  Password
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
                    disabled={loading || !!socialLoading}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-brand-navy-700 font-medium">
                  Confirm
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
                    disabled={loading || !!socialLoading}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-brand-navy-400 -mt-2">
              At least 8 characters
            </p>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-brand-sky-500 hover:bg-brand-sky-600 text-white font-semibold text-base shadow-lg shadow-brand-sky-500/25 transition-all hover:shadow-xl hover:shadow-brand-sky-500/30"
              disabled={loading || !!socialLoading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Terms */}
          <p className="mt-4 text-xs text-center text-brand-navy-400">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-brand-sky-600 hover:underline">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-brand-sky-600 hover:underline">Privacy Policy</Link>
          </p>

          {/* Sign in link */}
          <p className="mt-6 text-center text-brand-navy-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-brand-sky-600 hover:text-brand-sky-700 font-semibold"
            >
              Sign in
            </Link>
          </p>

          {/* Dev mode helper */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-700">
                <strong>Dev:</strong> Social auth requires Supabase OAuth config. Use email/password for testing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SignupSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <main id="main-content">
      <Suspense fallback={<SignupSkeleton />}>
        <SignupForm />
      </Suspense>
    </main>
  );
}
