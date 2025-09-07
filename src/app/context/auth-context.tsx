"use client";

import { useRouter } from "next/navigation";
import type { User } from "@/lib/types/auth";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type AuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    role: number
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Edited Here: Changed from default export to named export to match your imports
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Edited Here: Derive isAuthenticated from user state instead of separate state
  const isAuthenticated = !!user;

  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        setUser(null);
        setIsLoading(false);
        return false;
      }
      const data = await response.json();
      setUser(data.user);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error checking auth:", error);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        // Edited Here: Check for both 'error' and 'message' fields from your API response
        throw new Error(data.error || data.message || "Login failed");
      }

      const data = await response.json();
      setUser(data.user);
      router.push("/");
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    role: number
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      const data = await response.json();
      setUser(data.user);
      router.push("/chat");
    } catch (error) {
      console.error("Error registering:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  };
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
