import { useAuth } from "@/app/context/auth-context";

export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return { user: null, loading: true };
  }
  if (!user) {
    return { user: null, loading: false };
  }
  return { user, loading: false };
}
