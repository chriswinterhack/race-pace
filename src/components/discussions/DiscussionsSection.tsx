"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Plus,
  ArrowLeft,
  Pin,
  Loader2,
  Send,
  Trash2,
  Users,
  Lock,
} from "lucide-react";
import { Button, Card, CardContent, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  Discussion,
  DiscussionWithReplies,
  DiscussionCategory,
  DiscussionReply,
} from "@/types/discussions";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/discussions";

interface DiscussionsSectionProps {
  raceId: string;
  raceName?: string;
  compact?: boolean;
}

type ViewMode = "list" | "detail" | "new";

export function DiscussionsSection({ raceId, raceName, compact = false }: DiscussionsSectionProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<DiscussionWithReplies | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedCategory, setSelectedCategory] = useState<DiscussionCategory | "all">("all");
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    fetchDiscussions();
  }, [raceId, selectedCategory]);

  async function fetchDiscussions() {
    setLoading(true);
    try {
      const categoryParam = selectedCategory !== "all" ? `&category=${selectedCategory}` : "";
      const response = await fetch(`/api/races/${raceId}/discussions?limit=50${categoryParam}`);
      const result = await response.json();

      if (response.status === 403) {
        setIsRegistered(false);
        setDiscussions([]);
      } else if (result.data) {
        setIsRegistered(true);
        setDiscussions(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch discussions:", error);
      toast.error("Failed to load discussions");
    }
    setLoading(false);
  }

  async function fetchDiscussionDetail(discussionId: string) {
    try {
      const response = await fetch(`/api/races/${raceId}/discussions/${discussionId}`);
      const result = await response.json();

      if (result.data) {
        setSelectedDiscussion(result.data);
        setViewMode("detail");
      }
    } catch (error) {
      console.error("Failed to fetch discussion:", error);
      toast.error("Failed to load discussion");
    }
  }

  function handleBack() {
    setViewMode("list");
    setSelectedDiscussion(null);
    fetchDiscussions();
  }

  // Not registered state
  if (isRegistered === false) {
    return (
      <div className="text-center py-12">
        <div className="p-4 rounded-full bg-brand-navy-100 inline-flex mb-4">
          <Lock className="h-8 w-8 text-brand-navy-400" />
        </div>
        <h3 className="text-lg font-semibold text-brand-navy-900">
          Join the Conversation
        </h3>
        <p className="mt-2 text-brand-navy-600 max-w-md mx-auto">
          Add this race to your plans to access community discussions with other registered participants.
        </p>
      </div>
    );
  }

  // Loading state
  if (loading && discussions.length === 0) {
    return (
      <div className="space-y-4">
        {!compact && <Skeleton className="h-10 w-full" />}
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // New discussion form
  if (viewMode === "new") {
    return (
      <NewDiscussionForm
        raceId={raceId}
        onBack={handleBack}
        onCreated={(discussion) => {
          setDiscussions([discussion, ...discussions]);
          handleBack();
        }}
      />
    );
  }

  // Discussion detail view
  if (viewMode === "detail" && selectedDiscussion) {
    return (
      <DiscussionDetail
        discussion={selectedDiscussion}
        raceId={raceId}
        onBack={handleBack}
        onReplyAdded={(reply) => {
          setSelectedDiscussion({
            ...selectedDiscussion,
            replies: [...selectedDiscussion.replies, reply],
            reply_count: selectedDiscussion.reply_count + 1,
          });
        }}
        onDeleted={handleBack}
      />
    );
  }

  // Discussion list view
  return (
    <div className="space-y-4">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-heading font-bold text-brand-navy-900">
              Community Discussions
            </h2>
            <p className="mt-1 text-sm text-brand-navy-600">
              Connect with other {raceName || "race"} participants
            </p>
          </div>
          <Button onClick={() => setViewMode("new")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Discussion
          </Button>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <CategoryPill
          label="All"
          active={selectedCategory === "all"}
          onClick={() => setSelectedCategory("all")}
        />
        {(Object.keys(CATEGORY_LABELS) as DiscussionCategory[]).map((cat) => (
          <CategoryPill
            key={cat}
            label={CATEGORY_LABELS[cat]}
            category={cat}
            active={selectedCategory === cat}
            onClick={() => setSelectedCategory(cat)}
          />
        ))}
      </div>

      {/* Compact header with new button */}
      {compact && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-brand-navy-600">
            {discussions.length} {discussions.length === 1 ? "discussion" : "discussions"}
          </p>
          <Button size="sm" onClick={() => setViewMode("new")} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </div>
      )}

      {/* Discussion List */}
      {discussions.length === 0 ? (
        <EmptyState onNewClick={() => setViewMode("new")} />
      ) : (
        <div className="space-y-3">
          {discussions.map((discussion) => (
            <DiscussionCard
              key={discussion.id}
              discussion={discussion}
              onClick={() => fetchDiscussionDetail(discussion.id)}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Category Filter Pill
function CategoryPill({
  label,
  category,
  active,
  onClick,
}: {
  label: string;
  category?: DiscussionCategory;
  active: boolean;
  onClick: () => void;
}) {
  const colors = category ? CATEGORY_COLORS[category] : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
        active
          ? colors
            ? `${colors.bg} ${colors.text}`
            : "bg-brand-navy-900 text-white"
          : "bg-brand-navy-100 text-brand-navy-600 hover:bg-brand-navy-200"
      )}
    >
      {label}
    </button>
  );
}

// Discussion Card
function DiscussionCard({
  discussion,
  onClick,
  compact = false,
}: {
  discussion: Discussion;
  onClick: () => void;
  compact?: boolean;
}) {
  const colors = CATEGORY_COLORS[discussion.category];
  const timeAgo = formatDistanceToNow(new Date(discussion.last_activity_at), { addSuffix: true });

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-brand-sky-300",
        discussion.is_pinned && "border-brand-sky-300 bg-brand-sky-50/50"
      )}
      onClick={onClick}
    >
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {discussion.user?.avatar_url ? (
              <img
                src={discussion.user.avatar_url}
                alt={discussion.user.name || "User"}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-navy-200 flex items-center justify-center">
                <Users className="h-5 w-5 text-brand-navy-500" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {discussion.is_pinned && (
                <Pin className="h-3.5 w-3.5 text-brand-sky-500 flex-shrink-0" />
              )}
              <span className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                colors.bg, colors.text
              )}>
                {CATEGORY_LABELS[discussion.category]}
              </span>
            </div>

            <h3 className={cn(
              "font-semibold text-brand-navy-900 mt-1 line-clamp-1",
              compact ? "text-sm" : "text-base"
            )}>
              {discussion.title}
            </h3>

            {!compact && (
              <p className="text-sm text-brand-navy-600 mt-1 line-clamp-2">
                {discussion.body}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-brand-navy-500">
              <span>{discussion.user?.name || "Anonymous"}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {discussion.reply_count}
              </span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State
function EmptyState({ onNewClick }: { onNewClick: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="p-4 rounded-full bg-brand-navy-100 inline-flex mb-4">
        <MessageSquare className="h-8 w-8 text-brand-navy-400" />
      </div>
      <h3 className="text-lg font-semibold text-brand-navy-900">
        No discussions yet
      </h3>
      <p className="mt-2 text-brand-navy-600">
        Be the first to start a conversation!
      </p>
      <Button onClick={onNewClick} className="mt-4 gap-2">
        <Plus className="h-4 w-4" />
        Start a Discussion
      </Button>
    </div>
  );
}

// New Discussion Form
function NewDiscussionForm({
  raceId,
  onBack,
  onCreated,
}: {
  raceId: string;
  onBack: () => void;
  onCreated: (discussion: Discussion) => void;
}) {
  const [category, setCategory] = useState<DiscussionCategory>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (title.length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }
    if (body.length < 10) {
      toast.error("Content must be at least 10 characters");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/races/${raceId}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, body }),
      });

      const result = await response.json();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Discussion posted!");
        onCreated(result.data);
      }
    } catch {
      toast.error("Failed to create discussion");
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-brand-navy-600 hover:text-brand-navy-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to discussions
      </button>

      <div>
        <h2 className="text-xl font-heading font-bold text-brand-navy-900">
          New Discussion
        </h2>
        <p className="mt-1 text-sm text-brand-navy-600">
          Share tips, ask questions, or connect with other participants
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Select */}
        <div>
          <label className="block text-sm font-medium text-brand-navy-700 mb-2">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_LABELS) as DiscussionCategory[]).map((cat) => {
              const colors = CATEGORY_COLORS[cat];
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                    category === cat
                      ? `${colors.bg} ${colors.text} ${colors.border}`
                      : "bg-white border-brand-navy-200 text-brand-navy-600 hover:bg-brand-navy-50"
                  )}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-brand-navy-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your mind?"
            maxLength={200}
            className="w-full px-4 py-2 border border-brand-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-sky-400 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-brand-navy-500">{title.length}/200</p>
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-brand-navy-700 mb-2">
            Content
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts, questions, or tips..."
            rows={6}
            maxLength={10000}
            className="w-full px-4 py-3 border border-brand-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-sky-400 focus:border-transparent resize-none"
          />
          <p className="mt-1 text-xs text-brand-navy-500">{body.length}/10,000</p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="gap-2">
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Post Discussion
          </Button>
        </div>
      </form>
    </div>
  );
}

// Discussion Detail View
function DiscussionDetail({
  discussion,
  raceId,
  onBack,
  onReplyAdded,
  onDeleted,
}: {
  discussion: DiscussionWithReplies;
  raceId: string;
  onBack: () => void;
  onReplyAdded: (reply: DiscussionReply) => void;
  onDeleted: () => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const colors = CATEGORY_COLORS[discussion.category];

  async function handleSubmitReply(e: React.FormEvent) {
    e.preventDefault();

    if (replyText.length < 1) {
      toast.error("Reply cannot be empty");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/races/${raceId}/discussions/${discussion.id}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: replyText }),
        }
      );

      const result = await response.json();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Reply posted!");
        setReplyText("");
        onReplyAdded(result.data);
      }
    } catch {
      toast.error("Failed to post reply");
    }
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this discussion?")) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/races/${raceId}/discussions/${discussion.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Discussion deleted");
        onDeleted();
      } else {
        toast.error("Failed to delete discussion");
      }
    } catch {
      toast.error("Failed to delete discussion");
    }
    setDeleting(false);
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-brand-navy-600 hover:text-brand-navy-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to discussions
      </button>

      {/* Discussion Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          {discussion.is_pinned && (
            <Pin className="h-4 w-4 text-brand-sky-500" />
          )}
          <span className={cn(
            "px-2 py-0.5 rounded text-xs font-medium",
            colors.bg, colors.text
          )}>
            {CATEGORY_LABELS[discussion.category]}
          </span>
        </div>

        <h1 className="text-2xl font-heading font-bold text-brand-navy-900">
          {discussion.title}
        </h1>

        <div className="flex items-center gap-3 mt-3">
          {discussion.user?.avatar_url ? (
            <img
              src={discussion.user.avatar_url}
              alt={discussion.user.name || "User"}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-navy-200 flex items-center justify-center">
              <Users className="h-5 w-5 text-brand-navy-500" />
            </div>
          )}
          <div>
            <p className="font-medium text-brand-navy-900">
              {discussion.user?.name || "Anonymous"}
            </p>
            <p className="text-sm text-brand-navy-500">
              {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}
            </p>
          </div>

          {discussion.isAuthor && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="ml-auto text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Discussion Body */}
      <div className="prose prose-brand-navy max-w-none">
        <p className="text-brand-navy-700 whitespace-pre-wrap">{discussion.body}</p>
      </div>

      {/* Divider */}
      <div className="border-t border-brand-navy-200" />

      {/* Replies Section */}
      <div>
        <h2 className="font-semibold text-brand-navy-900 mb-4">
          {discussion.reply_count} {discussion.reply_count === 1 ? "Reply" : "Replies"}
        </h2>

        {discussion.replies.length === 0 ? (
          <p className="text-brand-navy-500 text-sm py-4">
            No replies yet. Be the first to respond!
          </p>
        ) : (
          <div className="space-y-4">
            {discussion.replies.map((reply) => (
              <ReplyCard key={reply.id} reply={reply} />
            ))}
          </div>
        )}
      </div>

      {/* Reply Form */}
      <form onSubmit={handleSubmitReply} className="pt-4 border-t border-brand-navy-200">
        <label className="block text-sm font-medium text-brand-navy-700 mb-2">
          Add a reply
        </label>
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Share your thoughts..."
          rows={3}
          maxLength={5000}
          className="w-full px-4 py-3 border border-brand-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-sky-400 focus:border-transparent resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-brand-navy-500">{replyText.length}/5,000</p>
          <Button type="submit" disabled={submitting || replyText.length === 0} className="gap-2">
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Reply
          </Button>
        </div>
      </form>
    </div>
  );
}

// Reply Card
function ReplyCard({ reply }: { reply: DiscussionReply }) {
  return (
    <div className="flex gap-3">
      {reply.user?.avatar_url ? (
        <img
          src={reply.user.avatar_url}
          alt={reply.user.name || "User"}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-brand-navy-200 flex items-center justify-center flex-shrink-0">
          <Users className="h-4 w-4 text-brand-navy-500" />
        </div>
      )}
      <div className="flex-1 bg-brand-navy-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-brand-navy-900">
            {reply.user?.name || "Anonymous"}
          </span>
          <span className="text-xs text-brand-navy-500">
            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-brand-navy-700 whitespace-pre-wrap">{reply.body}</p>
      </div>
    </div>
  );
}
