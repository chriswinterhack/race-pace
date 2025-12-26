"use client";

import { useState } from "react";
import { Mail, Gift, Loader2, Check, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Label,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InviteUserModal({ open, onOpenChange, onSuccess }: InviteUserModalProps) {
  const [email, setEmail] = useState("");
  const [grantPremium, setGrantPremium] = useState(true);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ inviteCode: string; emailSent: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          grantPremium,
          premiumDays: 365, // 1 year default
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to send invite");
        setLoading(false);
        return;
      }

      setResult({
        inviteCode: data.inviteCode,
        emailSent: data.emailSent,
      });

      toast.success("Invite sent successfully!");
      onSuccess?.();
    } catch (err) {
      console.error("Error sending invite:", err);
      toast.error("Failed to send invite");
    }

    setLoading(false);
  };

  const handleCopyCode = async () => {
    if (!result?.inviteCode) return;

    const signupUrl = `${window.location.origin}/signup?invite=${result.inviteCode}`;
    await navigator.clipboard.writeText(signupUrl);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setEmail("");
    setGrantPremium(true);
    setNotes("");
    setResult(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-brand-sky-500" />
            Invite User
          </DialogTitle>
          <DialogDescription>
            Send a VIP invite with optional free premium access.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          // Success state
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
            </div>

            <div className="text-center">
              <p className="font-medium text-brand-navy-900">Invite Sent!</p>
              <p className="text-sm text-brand-navy-600 mt-1">
                {result.emailSent
                  ? `Email sent to ${email}`
                  : "Email sending is disabled in development"}
              </p>
            </div>

            <div className="p-4 bg-brand-navy-50 rounded-lg">
              <p className="text-xs text-brand-navy-500 mb-2">Invite Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-lg text-brand-navy-900">
                  {result.inviteCode}
                </code>
                <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-brand-navy-500 mt-2">
                Expires in 30 days
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          // Form state
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="athlete@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-brand-sky-50 border border-brand-sky-200">
              <input
                type="checkbox"
                id="grantPremium"
                checked={grantPremium}
                onChange={(e) => setGrantPremium(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-brand-navy-300 text-brand-sky-600 focus:ring-brand-sky-500"
              />
              <div className="flex-1">
                <label
                  htmlFor="grantPremium"
                  className="font-medium text-brand-navy-900 cursor-pointer flex items-center gap-2"
                >
                  <Gift className="h-4 w-4 text-brand-sky-600" />
                  Grant free premium (1 year)
                </label>
                <p className="text-sm text-brand-navy-600 mt-1">
                  User will get full premium access for 1 year when they sign up.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="e.g., Pro triathlete - feedback agreement"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <p className="text-xs text-brand-navy-500">
                Internal note for tracking purposes
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !email}
                className={cn(
                  "flex-1 gap-2",
                  "bg-brand-navy-900 hover:bg-brand-navy-800"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Send Invite
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
