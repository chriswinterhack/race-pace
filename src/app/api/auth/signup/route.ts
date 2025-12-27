import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIP, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit by IP address - use same limit as login
  const ip = getClientIP(request);
  const rateLimitResult = rateLimit(`auth:signup:${ip}`, RATE_LIMITS.auth);

  if (!rateLimitResult.allowed) {
    console.warn(`Rate limit exceeded for signup from IP: ${ip}`);
    return rateLimitResult.response;
  }

  try {
    const body = await request.json();
    const { email, firstName, lastName, password, city, state, inviteCode } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.warn(`Failed signup attempt for email: ${email} from IP: ${ip}`);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Check for duplicate email (identities will be empty)
    if (data.user?.identities?.length === 0) {
      return NextResponse.json(
        { error: "This email is already registered. Try signing in." },
        { status: 400 }
      );
    }

    // Save user profile data if provided
    if (data.user?.id && (firstName || lastName || city || state)) {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          first_name: firstName || null,
          last_name: lastName || null,
          city: city || null,
          state: state || null,
        })
        .eq("id", data.user.id);

      if (updateError) {
        console.error("Error saving user profile:", updateError);
        // Don't fail signup if profile save fails
      }
    }

    // Process invite code if provided
    let inviteResult = null;
    if (inviteCode && data.user?.id) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        const inviteResponse = await fetch(`${appUrl}/api/invite/${inviteCode}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.user.id }),
        });

        if (inviteResponse.ok) {
          inviteResult = await inviteResponse.json();
        }
      } catch (inviteError) {
        console.error("Error processing invite:", inviteError);
        // Don't fail signup if invite processing fails
      }
    }

    return NextResponse.json({
      data: {
        user: data.user,
        session: data.session,
        needsEmailConfirmation: !data.session,
        invite: inviteResult,
      },
      error: null,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
