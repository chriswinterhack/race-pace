import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIP, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  source: z.string().optional().default("homepage"),
});

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = getClientIP(request);
  const rateLimitResult = rateLimit(`waitlist:${ip}`, RATE_LIMITS.auth);

  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  try {
    const body = await request.json();
    const validation = waitlistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid email" },
        { status: 400 }
      );
    }

    const { email, source } = validation.data;
    const supabase = await createClient();

    // Check if already on waitlist
    const { data: existing } = await supabase
      .from("waitlist")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      // Already on waitlist - return success anyway
      return NextResponse.json({
        success: true,
        message: "You're already on the list!",
        alreadyExists: true,
      });
    }

    // Add to waitlist
    const { error: insertError } = await supabase
      .from("waitlist")
      .insert({
        email: email.toLowerCase(),
        source,
      });

    if (insertError) {
      console.error("Failed to add to waitlist:", insertError);
      return NextResponse.json(
        { error: "Failed to join waitlist. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "You're on the list! We'll notify you when we launch.",
    });
  } catch (err) {
    console.error("Waitlist error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
