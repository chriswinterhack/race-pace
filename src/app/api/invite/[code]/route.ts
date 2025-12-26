import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Validate an invite code (public endpoint for signup page)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { valid: false, reason: "not_found" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Look up the invite
    const { data: invite, error } = await supabase
      .from("vip_invites")
      .select("id, email, grant_premium, premium_duration_days, status, expires_at")
      .eq("invite_code", code.toUpperCase())
      .single();

    if (error || !invite) {
      return NextResponse.json({
        valid: false,
        reason: "not_found",
      });
    }

    // Check if already used
    if (invite.status === "accepted") {
      return NextResponse.json({
        valid: false,
        reason: "used",
      });
    }

    // Check if revoked
    if (invite.status === "revoked") {
      return NextResponse.json({
        valid: false,
        reason: "revoked",
      });
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      // Update status to expired
      await supabase
        .from("vip_invites")
        .update({ status: "expired" })
        .eq("id", invite.id);

      return NextResponse.json({
        valid: false,
        reason: "expired",
      });
    }

    // Valid invite
    return NextResponse.json({
      valid: true,
      email: invite.email,
      grantsPremium: invite.grant_premium,
      premiumDays: invite.premium_duration_days,
    });
  } catch (err) {
    console.error("Error validating invite:", err);
    return NextResponse.json(
      { valid: false, reason: "error" },
      { status: 500 }
    );
  }
}

// POST - Accept an invite (called after successful signup)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!code || !userId) {
      return NextResponse.json(
        { error: "Missing code or userId" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the invite
    const { data: invite, error: fetchError } = await supabase
      .from("vip_invites")
      .select("*")
      .eq("invite_code", code.toUpperCase())
      .eq("status", "pending")
      .single();

    if (fetchError || !invite) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date(invite.expires_at) < new Date()) {
      await supabase
        .from("vip_invites")
        .update({ status: "expired" })
        .eq("id", invite.id);

      return NextResponse.json(
        { error: "Invite has expired" },
        { status: 400 }
      );
    }

    // Mark invite as accepted
    const { error: updateError } = await supabase
      .from("vip_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        accepted_by: userId,
      })
      .eq("id", invite.id);

    if (updateError) {
      console.error("Failed to mark invite as accepted:", updateError);
      return NextResponse.json(
        { error: "Failed to process invite" },
        { status: 500 }
      );
    }

    // If invite grants premium, create comped subscription
    if (invite.grant_premium) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + invite.premium_duration_days);

      const { error: subError } = await supabase
        .from("comped_subscriptions")
        .insert({
          user_id: userId,
          granted_by: invite.invited_by,
          expires_at: expiresAt.toISOString(),
          source: "vip_invite",
          source_id: invite.id,
          notes: invite.notes,
        });

      if (subError) {
        console.error("Failed to create comped subscription:", subError);
        // Don't fail the request - invite was accepted, just premium grant failed
      }
    }

    return NextResponse.json({
      success: true,
      grantedPremium: invite.grant_premium,
      premiumDays: invite.grant_premium ? invite.premium_duration_days : 0,
    });
  } catch (err) {
    console.error("Error accepting invite:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
