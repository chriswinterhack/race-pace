"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Users,
  Crown,
  Sparkles,
  TrendingUp,
  Calendar,
  Loader2,
  RefreshCw,
  Mail,
  MoreVertical,
  Gift,
  X,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Input,
  Skeleton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { InviteUserModal, ManagePremiumModal } from "@/components/admin";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  subscription_status: string;
  created_at: string;
  subscription?: {
    is_lifetime: boolean;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  };
}

interface Stats {
  totalUsers: number;
  activeSubscribers: number;
  lifetimeMembers: number;
  freeUsers: number;
}

interface PendingInvite {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  invite_code: string;
  grant_premium: boolean;
  status: string;
  notes: string | null;
  created_at: string;
  expires_at: string;
}

interface RawUser {
  id: string;
  email: string;
  name: string | null;
  subscription_status: string | null;
  created_at: string;
  subscriptions?: Array<{
    status: string;
    is_lifetime: boolean;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  }>;
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeSubscribers: 0,
    lifetimeMembers: 0,
    freeUsers: 0,
  });
  const [filter, setFilter] = useState<"all" | "active" | "lifetime" | "free">("all");

  // Pending invites state
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);

  // Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Subscriber | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscribers();
    fetchPendingInvites();
  }, []);

  async function fetchSubscribers() {
    setLoading(true);

    try {
      // Fetch users with subscription data via API
      const response = await fetch("/api/admin/subscribers");
      const result = await response.json();

      if (result.error) {
        console.error("Error fetching subscribers:", result.error);
        setLoading(false);
        return;
      }

      const users = result.data;

    // Process users
    const processedUsers: Subscriber[] = (users || []).map((user: RawUser) => {
      const activeSubscription = user.subscriptions?.find(
        (s) => s.status === "active"
      );
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_status: user.subscription_status || "inactive",
        created_at: user.created_at,
        subscription: activeSubscription
          ? {
              is_lifetime: activeSubscription.is_lifetime,
              current_period_end: activeSubscription.current_period_end,
              cancel_at_period_end: activeSubscription.cancel_at_period_end,
            }
          : undefined,
      };
    });

    setSubscribers(processedUsers);

    // Calculate stats
    const totalUsers = processedUsers.length;
    const activeSubscribers = processedUsers.filter(
      (u) => u.subscription_status === "active"
    ).length;
    const lifetimeMembers = processedUsers.filter(
      (u) => u.subscription?.is_lifetime
    ).length;
    const freeUsers = processedUsers.filter(
      (u) => u.subscription_status !== "active"
    ).length;

    setStats({
      totalUsers,
      activeSubscribers,
      lifetimeMembers,
      freeUsers,
    });

    setLoading(false);
    } catch (err) {
      console.error("Error fetching subscribers:", err);
      setLoading(false);
    }
  }

  async function fetchPendingInvites() {
    setLoadingInvites(true);
    try {
      const response = await fetch("/api/admin/invites");
      const result = await response.json();

      if (result.error) {
        console.error("Error fetching invites:", result.error);
        setLoadingInvites(false);
        return;
      }

      // Filter to only pending invites
      const pending = (result.data || []).filter(
        (invite: PendingInvite) => invite.status === "pending"
      );
      setPendingInvites(pending);
    } catch (err) {
      console.error("Error fetching invites:", err);
    }
    setLoadingInvites(false);
  }

  async function revokeInvite(inviteId: string) {
    try {
      const response = await fetch(`/api/admin/invites?id=${inviteId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.error) {
        console.error("Error revoking invite:", result.error);
        return;
      }

      // Refresh the list
      fetchPendingInvites();
    } catch (err) {
      console.error("Error revoking invite:", err);
    }
  }

  async function copyInviteLink(inviteCode: string, inviteId: string) {
    const signupUrl = `${window.location.origin}/signup?invite=${inviteCode}`;
    await navigator.clipboard.writeText(signupUrl);
    setCopiedInviteId(inviteId);
    setTimeout(() => setCopiedInviteId(null), 2000);
  }

  // Filter subscribers
  const filteredSubscribers = subscribers.filter((subscriber) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      subscriber.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subscriber.name?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    let matchesFilter = true;
    if (filter === "active") {
      matchesFilter = subscriber.subscription_status === "active" && !subscriber.subscription?.is_lifetime;
    } else if (filter === "lifetime") {
      matchesFilter = subscriber.subscription?.is_lifetime === true;
    } else if (filter === "free") {
      matchesFilter = subscriber.subscription_status !== "active";
    }

    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-navy-900">
            Subscribers
          </h1>
          <p className="text-brand-navy-600 mt-1">
            Manage user subscriptions and view analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowInviteModal(true)}
            className="gap-2 bg-brand-navy-900 hover:bg-brand-navy-800"
          >
            <Mail className="h-4 w-4" />
            Invite User
          </Button>
          <Button
            variant="outline"
            onClick={fetchSubscribers}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-navy-100">
                <Users className="h-5 w-5 text-brand-navy-600" />
              </div>
              <div>
                <p className="text-sm text-brand-navy-500">Total Users</p>
                {loading ? (
                  <Skeleton className="h-7 w-16 mt-0.5" />
                ) : (
                  <p className="text-2xl font-bold text-brand-navy-900">
                    {stats.totalUsers}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-sky-100">
                <Sparkles className="h-5 w-5 text-brand-sky-600" />
              </div>
              <div>
                <p className="text-sm text-brand-navy-500">Active Premium</p>
                {loading ? (
                  <Skeleton className="h-7 w-16 mt-0.5" />
                ) : (
                  <p className="text-2xl font-bold text-brand-sky-600">
                    {stats.activeSubscribers}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Crown className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-brand-navy-500">Lifetime</p>
                {loading ? (
                  <Skeleton className="h-7 w-16 mt-0.5" />
                ) : (
                  <p className="text-2xl font-bold text-amber-600">
                    {stats.lifetimeMembers}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-brand-navy-500">Conversion</p>
                {loading ? (
                  <Skeleton className="h-7 w-16 mt-0.5" />
                ) : (
                  <p className="text-2xl font-bold text-emerald-600">
                    {stats.totalUsers > 0
                      ? ((stats.activeSubscribers / stats.totalUsers) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invites Section */}
      {(loadingInvites || pendingInvites.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-navy-900 flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand-sky-500" />
              Pending Invites
              {!loadingInvites && (
                <span className="text-sm font-normal text-brand-navy-500">
                  ({pendingInvites.length})
                </span>
              )}
            </h2>
          </div>

          {loadingInvites ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-sky-500" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {pendingInvites.map((invite) => (
                <Card key={invite.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-brand-navy-900">
                            {invite.first_name || invite.last_name
                              ? `${invite.first_name || ""} ${invite.last_name || ""}`.trim()
                              : "No name"}
                          </p>
                          {invite.grant_premium && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-sky-100 text-brand-sky-700">
                              <Gift className="h-3 w-3" />
                              Premium
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-brand-navy-600 truncate">{invite.email}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-brand-navy-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Sent {formatDate(invite.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires {formatDate(invite.expires_at)}
                          </span>
                        </div>
                        {invite.notes && (
                          <p className="text-xs text-brand-navy-400 mt-1 italic">{invite.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyInviteLink(invite.invite_code, invite.id)}
                          className="h-8 px-2"
                        >
                          {copiedInviteId === invite.id ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeInvite(invite.id)}
                          className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: "all", label: "All" },
            { id: "active", label: "Premium" },
            { id: "lifetime", label: "Lifetime" },
            { id: "free", label: "Free" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                filter === f.id
                  ? "bg-brand-sky-500 text-white"
                  : "bg-brand-navy-100 text-brand-navy-600 hover:bg-brand-navy-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subscribers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-sky-500" />
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="p-8 text-center text-brand-navy-500">
              No subscribers found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-navy-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-navy-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-navy-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-navy-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-brand-navy-500 uppercase tracking-wider">
                      Renews
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-brand-navy-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-navy-100">
                  {filteredSubscribers.map((subscriber) => (
                    <tr
                      key={subscriber.id}
                      className="hover:bg-brand-navy-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-brand-navy-900">
                            {subscriber.name || "—"}
                          </p>
                          <p className="text-sm text-brand-navy-500">
                            {subscriber.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {subscriber.subscription?.is_lifetime ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <Crown className="h-3 w-3" />
                            Lifetime
                          </span>
                        ) : subscriber.subscription_status === "active" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-brand-sky-100 text-brand-sky-700">
                            <Sparkles className="h-3 w-3" />
                            Premium
                          </span>
                        ) : subscriber.subscription_status === "past_due" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Past Due
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-navy-100 text-brand-navy-600">
                            Free
                          </span>
                        )}
                        {subscriber.subscription?.cancel_at_period_end && (
                          <span className="ml-2 text-xs text-red-500">
                            Canceling
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-navy-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-brand-navy-400" />
                          {formatDate(subscriber.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-navy-600">
                        {subscriber.subscription?.is_lifetime ? (
                          <span className="text-amber-600">Never</span>
                        ) : subscriber.subscription?.current_period_end ? (
                          formatDate(subscriber.subscription.current_period_end)
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(subscriber);
                                setShowPremiumModal(true);
                              }}
                            >
                              <Gift className="h-4 w-4 mr-2" />
                              Manage Premium
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {!loading && (
        <p className="text-sm text-brand-navy-500 text-center">
          Showing {filteredSubscribers.length} of {subscribers.length} users
        </p>
      )}

      {/* Modals */}
      <InviteUserModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        onSuccess={() => {
          fetchSubscribers();
          fetchPendingInvites();
        }}
      />
      <ManagePremiumModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        user={selectedUser}
        onSuccess={fetchSubscribers}
      />
    </div>
  );
}
