// src/hooks/useAuth.ts
import { AuthContext } from "@/app/context/auth-context";
import { useContext } from "react";

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Custom hook for protected routes
export function useRequireAuth() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return { user: null, loading: true };
  }

  if (!user) {
    // Redirect handled by middleware, but you can also handle it here
    throw new Error("Authentication required");
  }

  return { user, loading: false };
}
