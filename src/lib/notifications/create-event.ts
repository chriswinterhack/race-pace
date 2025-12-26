import { SupabaseClient } from "@supabase/supabase-js";
import { CreateNotificationEventParams } from "@/types/notifications";

/**
 * Creates a notification event in the database.
 * This should be called from API routes when notable actions occur.
 * The event will be visible to relevant users based on their race subscriptions.
 */
export async function createNotificationEvent(
  supabase: SupabaseClient,
  params: CreateNotificationEventParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("notification_events").insert({
      type: params.type,
      actor_id: params.actor_id,
      race_id: params.race_id || null,
      discussion_id: params.discussion_id || null,
      target_user_id: params.target_user_id || null,
      title: params.title,
      body: params.body || null,
      metadata: params.metadata || {},
    });

    if (error) {
      console.error("Failed to create notification event:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error creating notification event:", err);
    return { success: false, error: "Failed to create notification" };
  }
}
