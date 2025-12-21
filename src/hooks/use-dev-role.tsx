"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { UserRole } from "@/types";

interface DevRoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAdmin: boolean;
  isCoach: boolean;
  isAthlete: boolean;
}

const DevRoleContext = createContext<DevRoleContextType | null>(null);

export function DevRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("admin");

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    // Persist to localStorage for page refreshes
    if (typeof window !== "undefined") {
      localStorage.setItem("dev-role", newRole);
    }
  }, []);

  // Load from localStorage on mount
  useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dev-role") as UserRole | null;
      if (saved && ["admin", "coach", "athlete"].includes(saved)) {
        setRoleState(saved);
      }
    }
  });

  const value: DevRoleContextType = {
    role,
    setRole,
    isAdmin: role === "admin",
    isCoach: role === "coach",
    isAthlete: role === "athlete",
  };

  return (
    <DevRoleContext.Provider value={value}>{children}</DevRoleContext.Provider>
  );
}

export function useDevRole() {
  const context = useContext(DevRoleContext);
  if (!context) {
    throw new Error("useDevRole must be used within a DevRoleProvider");
  }
  return context;
}
