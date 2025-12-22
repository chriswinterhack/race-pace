"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, Lock } from "lucide-react";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          toast.error(`Too many login attempts. Please wait ${result.retryAfter || 60} seconds.`);
        } else if (result.error?.includes("Email not confirmed")) {
          toast.error("Email not confirmed. Check your email or contact support.");
        } else {
          toast.error(result.error || "Login failed");
        }
        setLoading(false);
        return;
      }

      if (result.data?.user) {
        toast.success("Signed in successfully");
        router.push(redirectTo);
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
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
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.error(`Too many signup attempts. Please wait ${result.retryAfter || 60} seconds.`);
        } else {
          toast.error(result.error || "Signup failed");
        }
        setLoading(false);
        return;
      }

      if (result.data?.needsEmailConfirmation) {
        toast.success("Account created! Check your email to confirm, then sign in.");
      } else if (result.data?.session) {
        toast.success("Account created!");
        router.push(redirectTo);
        router.refresh();
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("An error occurred. Please try again.");
    }

    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-heading text-brand-navy-900">
          Sign in to FinalClimb
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={8}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Sign In
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-brand-navy-600">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="text-brand-sky-600 hover:text-brand-sky-700 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>

        {/* Dev mode helper */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-800">
              <strong>Dev Mode:</strong> Enter any email/password and click &quot;Sign up&quot; to create an account, then sign in.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoginSkeleton() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Skeleton className="h-8 w-48 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-navy-50 to-brand-sky-50 p-4">
      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
