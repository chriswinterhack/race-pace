// Discussion types for race community

export type DiscussionCategory = "general" | "gear" | "logistics" | "training" | "strategy";

export const CATEGORY_LABELS: Record<DiscussionCategory, string> = {
  general: "General",
  gear: "Gear & Equipment",
  logistics: "Logistics & Travel",
  training: "Training",
  strategy: "Race Strategy",
};

export const CATEGORY_COLORS: Record<DiscussionCategory, { bg: string; text: string; border: string }> = {
  general: { bg: "bg-brand-navy-100", text: "text-brand-navy-700", border: "border-brand-navy-200" },
  gear: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  logistics: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  training: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  strategy: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
};

export interface DiscussionUser {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

export interface Discussion {
  id: string;
  race_id?: string;
  category: DiscussionCategory;
  title: string;
  body: string;
  is_pinned: boolean;
  reply_count: number;
  last_activity_at: string;
  created_at: string;
  user_id?: string;
  user: DiscussionUser | null;
  isAuthor?: boolean;
}

export interface DiscussionReply {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  user: DiscussionUser | null;
}

export interface DiscussionWithReplies extends Discussion {
  replies: DiscussionReply[];
}

export interface DiscussionPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
