import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { sendEmail } from "@/lib/email/resend";
import { getVipInviteEmail } from "@/lib/email/templates/vip-invite";
import { z } from "zod";

// Generate a random invite code (e.g., VIP-ABCD-EFGH)
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `VIP-${segment()}-${segment()}`;
}

const inviteSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email("Invalid email address"),
  grantPremium: z.boolean().default(false),
  premiumDays: z.number().min(1).max(36500).default(365), // Max ~100 years for "lifetime"
  notes: z.string().max(500).optional(),
});

// POST - Send a VIP invite
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const validation = inviteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, grantPremium, premiumDays, notes } = validation.data;

    const supabase = await createClient();

    // Check if there's already a pending invite for this email
    const { data: existingInvite } = await supabase
      .from("vip_invites")
      .select("id, status")
      .eq("email", email.toLowerCase())
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: "A pending invite already exists for this email" },
        { status: 400 }
      );
    }

    // Check if user already has an account
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists. Use 'Manage Premium' instead." },
        { status: 400 }
      );
    }

    // Generate invite code and expiration
    const inviteCode = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    // Create the invite
    const { data: invite, error: insertError } = await supabase
      .from("vip_invites")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        invite_code: inviteCode,
        invited_by: auth.userId,
        grant_premium: grantPremium,
        premium_duration_days: premiumDays,
        notes,
        expires_at: expiresAt.toISOString(),
      })
      .select("id, invite_code")
      .single();

    if (insertError) {
      console.error("Failed to create invite:", insertError);
      return NextResponse.json(
        { error: "Failed to create invite" },
        { status: 500 }
      );
    }

    // Send the invite email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://finalclimbapp.com";
    const emailContent = getVipInviteEmail({
      inviteCode,
      grantsPremium: grantPremium,
      premiumDays,
      appUrl,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!emailResult.success) {
      console.error("Failed to send invite email:", emailResult.error);
      // Don't fail the request - invite is created, email just didn't send
    }

    return NextResponse.json({
      success: true,
      inviteId: invite.id,
      inviteCode: invite.invite_code,
      emailSent: emailResult.success,
    });
  } catch (err) {
    console.error("Error creating invite:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - List all invites
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const supabase = await createClient();

    const { data: invites, error } = await supabase
      .from("vip_invites")
      .select(`
        id,
        first_name,
        last_name,
        email,
        invite_code,
        grant_premium,
        premium_duration_days,
        status,
        notes,
        created_at,
        expires_at,
        accepted_at,
        invited_by,
        accepted_by
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Failed to fetch invites:", error);
      return NextResponse.json(
        { error: "Failed to fetch invites" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: invites });
  } catch (err) {
    console.error("Error fetching invites:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Revoke an invite
export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get("id");

    if (!inviteId) {
      return NextResponse.json(
        { error: "Invite ID required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("vip_invites")
      .update({ status: "revoked" })
      .eq("id", inviteId)
      .eq("status", "pending");

    if (error) {
      console.error("Failed to revoke invite:", error);
      return NextResponse.json(
        { error: "Failed to revoke invite" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error revoking invite:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
