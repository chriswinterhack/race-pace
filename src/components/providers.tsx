"use client";

import { DevRoleProvider } from "@/hooks/use-dev-role";
import { DevRoleSwitcher } from "@/components/dev/role-switcher";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DevRoleProvider>
      {children}
      <DevRoleSwitcher />
    </DevRoleProvider>
  );
}
