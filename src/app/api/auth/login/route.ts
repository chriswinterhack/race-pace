import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIP, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit by IP address
  const ip = getClientIP(request);
  const rateLimitResult = rateLimit(`auth:login:${ip}`, RATE_LIMITS.auth);

  if (!rateLimitResult.allowed) {
    console.warn(`Rate limit exceeded for login from IP: ${ip}`);
    return rateLimitResult.response;
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log failed login attempt (don't log password)
      console.warn(`Failed login attempt for email: ${email} from IP: ${ip}`);
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      data: {
        user: data.user,
        session: data.session,
      },
      error: null,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
