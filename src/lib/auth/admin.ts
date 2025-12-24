import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AdminAuthResult =
  | { authorized: true; userId: string }
  | { authorized: false; response: NextResponse };

/**
 * Verifies that the current user is authenticated AND has admin role.
 * Returns the user ID if authorized, or an error response if not.
 *
 * Usage:
 * ```typescript
 * const auth = await requireAdmin();
 * if (!auth.authorized) return auth.response;
 * // auth.userId is now available
 * ```
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401 }
      ),
    };
  }

  // Check admin flag
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    console.error("Error fetching user:", userError);
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized - User not found" },
        { status: 401 }
      ),
    };
  }

  if (!userData.is_admin) {
    console.warn(`Non-admin user ${user.id} attempted admin action`);
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, userId: user.id };
}

/**
 * Verifies that the current user is authenticated.
 * Returns the user ID if authorized, or an error response if not.
 */
export async function requireAuth(): Promise<AdminAuthResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401 }
      ),
    };
  }

  return { authorized: true, userId: user.id };
}
