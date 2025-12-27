import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set New Password",
  description: "Set a new password for your FinalClimb account.",
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
