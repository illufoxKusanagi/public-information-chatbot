"use client";

import { useRouter } from "next/navigation";
import type { User } from "@/lib/types/auth";
import { z } from "zod";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

const AUTH_STORAGE_KEY = "auth_token";
const REFRESH_STORAGE_KEY = "refresh_token";

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const router = useRouter();

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Edited here: Your superior centralized API call pattern
  const apiCall = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const token = localStorage.getItem(AUTH_STORAGE_KEY);
      const response = await fetch(`/api/auth${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }
      return data;
    },
    []
  );

  const storeTokens = useCallback(
    (accessToken: string, refreshToken: string) => {
      localStorage.setItem(AUTH_STORAGE_KEY, accessToken);
      localStorage.setItem(REFRESH_STORAGE_KEY, refreshToken);
    },
    []
  );

  const clearTokens = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(REFRESH_STORAGE_KEY);
  }, []);

  // const login = useCallback(
  //   async (identifier: string, password: string) => {
  //     try {
  //       setState((prev) => ({ ...prev, isLoading: true, error: null }));
  //       const data = await apiCall("/login", {
  //         method: "POST",
  //         body: JSON.stringify({ identifier, password }),
  //       });
  //       storeTokens(data.data.accessToken, data.data.refreshToken);
  //       setState((prev) => ({
  //         ...prev,
  //         user: {
  //           ...data.data.user,
  //           name: data.data.user.username,
  //         },
  //         isAuthenticated: true,
  //         isLoading: false,
  //       }));
  //       // router.push("/");
  //     } catch (error) {
  //       setState((prev) => ({
  //         ...prev,
  //         error: error instanceof Error ? error.message : "Login failed",
  //         isLoading: false,
  //       }));
  //       throw error;
  //     }
  //   },
  //   [apiCall, storeTokens]
  // );

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Login failed");
      }

      // Edited here: Store token BEFORE setting state
      localStorage.setItem(AUTH_STORAGE_KEY, data.data.accessToken);

      // Edited here: Map the response structure correctly
      const userData = {
        id: data.data.user.id,
        email: data.data.user.email,
        username: data.data.user.username,
        name: data.data.user.username,
        role: data.data.user.role,
      };

      setState({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      console.log("Login successful, user set:", userData); // Debug log

      // Don't redirect here - let the component handle it
    } catch (error) {
      console.error("Login error:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Login failed",
        isLoading: false,
        isAuthenticated: false,
        user: null,
      }));
      throw error;
    }
  }, []);

  // // Edited here: Updated to match your register route schema (username)
  // const register = useCallback(
  //   async (username: string, email: string, password: string) => {
  //     try {
  //       setState((prev) => ({ ...prev, isLoading: true, error: null }));
  //       const data = await apiCall("/register", {
  //         method: "POST",
  //         body: JSON.stringify({ username, email, password }),
  //       });
  //       storeTokens(data.data.accessToken, data.data.refreshToken);

  //       setState((prev) => ({
  //         ...prev,
  //         user: { ...data.data.user, name: data.data.username },
  //         isAuthenticated: true,
  //         isLoading: false,
  //       }));
  //       // router.push("/login");
  //     } catch (error) {
  //       setState((prev) => ({
  //         ...prev,
  //         error: error instanceof Error ? error.message : "Registration failed",
  //         isLoading: false,
  //       }));
  //       throw error;
  //     }
  //   },
  //   [apiCall, storeTokens]
  // );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error || "Registration failed");
        }

        // Edited here: Store token BEFORE setting state
        localStorage.setItem(AUTH_STORAGE_KEY, data.data.accessToken);

        // Edited here: Map the response structure correctly
        const userData = {
          id: data.data.user.id,
          email: data.data.user.email,
          username: data.data.user.username,
          name: data.data.user.username,
          role: data.data.user.role,
        };

        setState({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        console.log("Registration successful, user set:", userData); // Debug log
      } catch (error) {
        console.error("Registration error:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Registration failed",
          isLoading: false,
          isAuthenticated: false,
          user: null,
        }));
        throw error;
      }
    },
    []
  );

  // Edited here: Your superior logout pattern - client-side cleanup
  const logout = useCallback(async () => {
    clearTokens();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    if (typeof window !== "undefined") {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("chat_") || key.startsWith("app_")) {
          localStorage.removeItem(key);
        }
      });
    }
    router.push("/auth/login");
    toast.success("Logout berhasil!");
  }, [clearTokens, router]);

  // const refreshAuth = useCallback(async () => {
  //   try {
  //     const token = localStorage.getItem(AUTH_STORAGE_KEY);
  //     if (!token) {
  //       setState((prev) => ({ ...prev, isLoading: false }));
  //       return;
  //     }

  //     const data = await apiCall("/me");

  //     setState((prev) => ({
  //       ...prev,
  //       user: { ...data.data.user, name: data.data.username },
  //       isAuthenticated: true,
  //       isLoading: false,
  //     }));
  //   } catch (error) {
  //     console.error("Auth refresh failed:", error);
  //     clearTokens();
  //     setState({
  //       user: null,
  //       isAuthenticated: false,
  //       isLoading: false,
  //       error: null,
  //     });
  //   }
  // }, [apiCall, clearTokens]);

  const refreshAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!token) {
        console.log("No token found, user not authenticated");
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
          user: null,
        }));
        return;
      }

      console.log("Refreshing auth with token..."); // Debug log

      const response = await fetch("/api/auth/me", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Auth refresh failed:", data.message);
        throw new Error(data.message || "Auth refresh failed");
      }

      // Edited here: Handle /me endpoint response structure
      const userData = {
        id: data.data.user.id,
        email: data.data.user.email,
        username: data.data.user.username,
        name: data.data.user.username,
        role: data.data.user.role,
      };

      setState({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      console.log("Auth refreshed successfully, user:", userData); // Debug log
    } catch (error) {
      console.error("Auth refresh failed:", error);
      clearTokens();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, [clearTokens]);

  useEffect(() => {
    console.log("AuthProvider mounted, refreshing auth...");
    refreshAuth();
  }, [refreshAuth]);

  // Edited here: Add debug logging for state changes
  useEffect(() => {
    console.log("Auth state changed:", {
      isAuthenticated: state.isAuthenticated,
      user: state.user?.username,
      isLoading: state.isLoading,
    });
  }, [state.isAuthenticated, state.user, state.isLoading]);

  // Edited here: Auto-refresh tokens before expiry
  // useEffect(() => {
  //   if (!state.isAuthenticated) return;
  //   const interval = setInterval(() => {
  //     refreshAuth();
  //   }, 14 * 60 * 1000); // Refresh every 14 minutes
  //   return () => clearInterval(interval);
  // }, [state.isAuthenticated, refreshAuth]);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    refreshAuth,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// "use client";

// import { useRouter } from "next/navigation";
// import type { User } from "@/lib/types/auth";
// import {
//   createContext,
//   ReactNode,
//   useContext,
//   useEffect,
//   useState,
// } from "react";

// interface AuthContextType {
//   user: User | null;
//   isLoading: boolean;
//   isAuthenticated: boolean;
//   login: (identifier: string, password: string) => Promise<void>; // Edited here: Changed to identifier to match your login route
//   logout: () => void;
//   register: (
//     username: string,
//     email: string,
//     password: string
//   ) => Promise<void>;
// }

// export const AuthContext = createContext<AuthContextType | undefined>(
//   undefined
// );

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export function AuthProvider({ children }: AuthProviderProps) {
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [user, setUser] = useState<User | null>(null);
//   const [accessToken, setAccessToken] = useState<string>("");
//   const router = useRouter();

//   // TODO: Consider to make isAuthenticated more robust and clearer
//   const isAuthenticated = user !== null && accessToken !== "";

//   const login = async (identifier: string, password: string) => {
//     try {
//       const response = await fetch("/api/auth/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ identifier, password }),
//       });

//       const result = await response.json();

//       if (!result.success) {
//         throw new Error(result.message);
//       }
//       setUser(result.data.user);
//       setAccessToken(result.data.accessToken);
//       localStorage.setItem("accessToken", result.data.accessToken);
//     } catch (error) {
//       console.error("Login error: ", error);
//       throw error;
//     }
//   };

//   const register = async (
//     username: string,
//     email: string,
//     password: string
//   ) => {
//     try {
//       const response = await fetch("/api/auth/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username, email, password }),
//       });
//       const result = await response.json();
//       if (!result.success) {
//         throw new Error(result.message);
//       }
//       setUser(result.data.user);
//       setAccessToken(result.data.accessToken);
//       localStorage.setItem("accessToken", result.data.accessToken);
//     } catch (error) {
//       console.error("Registration error: ", error);
//       throw error;
//     }
//   };

//   const logout = () => {
//     setUser(null);
//     setAccessToken("");
//     localStorage.removeItem("accessToken");
//     document.cookie =
//       "refresh-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
//     router.push("/auth/login");
//   };

//   useEffect(() => {
//     const checkAuth = async () => {
//       try {
//         const storedToken = localStorage.getItem("accessToken");
//         if (!storedToken) {
//           setIsLoading(false);
//           return;
//         }
//         const response = await fetch("/api/auth/me", {
//           headers: {
//             Authorization: `Bearer ${storedToken}`,
//           },
//         });
//         if (response.ok) {
//           const result = await response.json();
//           if (result.success) {
//             setUser(result.data.user);
//           }
//         } else {
//           localStorage.removeItem("accessToken");
//         }
//       } catch (error) {
//         console.error("Auth check error:", error);
//         localStorage.removeItem("accessToken");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     checkAuth();
//   }, []);

//   return (
//     <AuthContext.Provider
//       value={{ user, isLoading, isAuthenticated, login, logout, register }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// function getCookie(name: string): string | null {
//   if (typeof document === "undefined") return null;
//   const value = `; ${document.cookie}`;
//   const parts = value.split(`; ${name}=`);
//   if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
//   return null;
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// }

// // // TODO : consider to use old code instead of the new generated (single commented)

// // "use client";

// // import { useRouter } from "next/navigation";
// // import type { User } from "@/lib/types/auth";
// // import { z } from "zod";
// // import {
// //   createContext,
// //   ReactNode,
// //   useCallback,
// //   useContext,
// //   useEffect,
// //   useState,
// // } from "react";

// // // interface AuthState {
// // //   user: User | null;
// // //   isAuthenticated: boolean;
// // //   isLoading: boolean;
// // //   error: string | null;
// // // }

// // // interface AuthContextType extends AuthState {
// // //   login: (identifier: string, password: string) => Promise<void>;
// // //   register: (
// // //     username: string,
// // //     email: string,
// // //     password: string
// // //   ) => Promise<void>;
// // //   refreshAuth: () => Promise<void>;
// // //   clearError: () => void;
// // //   logout: () => Promise<void>;
// // //   // checkAuth: () => Promise<boolean>;
// // // }

// // interface AuthContextType {
// //   user: User | null;
// //   isLoading: boolean;
// //   login: (email: string, password: string) => Promise<void>;
// //   logout: () => void;
// //   register: (name: string, email: string, password: string) => Promise<void>;
// // }

// // export const AuthContext = createContext<AuthContextType | undefined>(
// //   undefined
// // );

// // interface AuthProviderProps {
// //   children: ReactNode;
// // }

// // const AUTH_STORAGE_KEY = "auth_token";
// // const REFRESH_STORAGE_KEY = "refresh_token";

// // export function AuthProvider({ children }: AuthProviderProps) {
// //   const [isLoading, setIsLoading] = useState<boolean>(true);
// //   const [user, setUser] = useState<User | null>(null);
// //   const router = useRouter();

// //   const login = async (email: string, password: string) => {
// //     try {
// //       const response = await fetch("/api/auth/login", {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({ email, password }),
// //       });

// //       const result = await response.json();

// //       if (!result.success) {
// //         throw new Error(result.message);
// //       }

// //       setUser(result.data.user);
// //     } catch (error) {
// //       console.error("Login error: ", error);
// //       throw error;
// //     }
// //   };

// //   const register = async (name: string, email: string, password: string) => {
// //     try {
// //       const respponse = await fetch("/api/auth/register", {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({ name, email, password, confirmPassword }), // TODO : why confirm password is red?
// //       });
// //       const result = await respponse.json();
// //       if (!result.success) {
// //         throw new Error(result.message);
// //       }
// //       setUser(result.data.user);
// //     } catch (error) {
// //       console.error("Registration error: ", error);
// //       throw error;
// //     }
// //   };

// //   // TODO : consider to review this code instead of stupid code ai gave
// //   // const logOut = () => {
// //   //   setUser(null);
// //   //   setToken("");
// //   //   localStorage.removeItem("site");
// //   //   navigate("/login");
// //   // };

// //   const logout = () => {
// //     document.cookie =
// //       "auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
// //     setUser(null);
// //   };

// //   useEffect(() => {
// //     const checkAuth = async () => {
// //       try {
// //         const response = await fetch("/api/auth/me");
// //         if (response.ok) {
// //           const result = await response.json();
// //           if (result.success) {
// //             setUser(result.data.user);
// //           }
// //         }
// //       } catch (error) {
// //         console.error("Auth check error:", error);
// //       } finally {
// //         setIsLoading(false);
// //       }
// //     };

// //     checkAuth();
// //   }, []);
// //   // const [state, setState] = useState<AuthState>({
// //   //   user: null,
// //   //   isAuthenticated: false,
// //   //   isLoading: true,
// //   //   error: null,
// //   // });

// //   // const clearError = useCallback(() => {
// //   //   setState((prev) => ({ ...prev, error: null }));
// //   // }, []);

// //   // const apiCall = useCallback(
// //   //   async (endpoint: string, options: RequestInit = {}) => {
// //   //     const token = localStorage.getItem(AUTH_STORAGE_KEY);
// //   //     const response = await fetch(`/api/auth${endpoint}`, {
// //   //       ...options,
// //   //       headers: {
// //   //         "Content-Type": "application/json",
// //   //         ...(token && { Authorization: `Bearer ${token}` }),
// //   //         ...options.headers,
// //   //       },
// //   //     });
// //   //     const data = await response.json();
// //   //     if (!response.ok) {
// //   //       throw new Error(data.error || "Request failed");
// //   //     }
// //   //     return data;
// //   //   },
// //   //   []
// //   // );

// //   // const storeTokens = useCallback(
// //   //   (accessToken: string, refreshToken: string) => {
// //   //     localStorage.setItem(AUTH_STORAGE_KEY, accessToken);
// //   //     localStorage.setItem(REFRESH_STORAGE_KEY, refreshToken);
// //   //   },
// //   //   []
// //   // );

// //   // const clearTokens = useCallback(() => {
// //   //   localStorage.removeItem(AUTH_STORAGE_KEY);
// //   //   localStorage.removeItem(REFRESH_STORAGE_KEY);
// //   // }, []);

// //   // const login = useCallback(
// //   //   async (email: string, password: string) => {
// //   //     try {
// //   //       setState((prev) => ({ ...prev, isLoading: true, error: null }));
// //   //       const data = await apiCall("/login", {
// //   //         method: "POST",
// //   //         body: JSON.stringify({ email, password }),
// //   //       });
// //   //       storeTokens(data.accessToken, data.refreshToken);
// //   //       setState((prev) => ({
// //   //         ...prev,
// //   //         user: data.user,
// //   //         isAuthenticated: true,
// //   //         isLoading: false,
// //   //       }));
// //   //     } catch (error) {
// //   //       setState((prev) => ({
// //   //         ...prev,
// //   //         error: error instanceof Error ? error.message : "Login failed",
// //   //         isLoading: false,
// //   //       }));
// //   //       throw error;
// //   //     }
// //   //   },
// //   //   [apiCall, storeTokens]
// //   // );

// //   // const register = useCallback(
// //   //   async (email: string, password: string, username: string) => {
// //   //     try {
// //   //       setState((prev) => ({ ...prev, isLoading: true, error: null }));
// //   //       const data = await apiCall("/register", {
// //   //         method: "POST",
// //   //         body: JSON.stringify({ email, password, username }),
// //   //       });
// //   //       storeTokens(data.accessToken, data.refreshToken);

// //   //       setState((prev) => ({
// //   //         ...prev,
// //   //         user: data.user,
// //   //         isAuthenticated: true,
// //   //         isLoading: false,
// //   //       }));
// //   //     } catch (error) {
// //   //       setState((prev) => ({
// //   //         ...prev,
// //   //         error: error instanceof Error ? error.message : "Login failed",
// //   //         isLoading: false,
// //   //       }));
// //   //       throw error;
// //   //     }
// //   //   },
// //   //   [apiCall, storeTokens]
// //   // );

// //   // const logout = useCallback(async () => {
// //   //   try {
// //   //     await apiCall("/logout", { method: "POST" });
// //   //   } catch (error) {
// //   //     console.error(`Logout error: ${error}`);
// //   //   } finally {
// //   //     clearTokens();
// //   //     setState({
// //   //       user: null,
// //   //       isAuthenticated: false,
// //   //       isLoading: false,
// //   //       error: null,
// //   //     });
// //   //   }
// //   // }, [apiCall, clearTokens]);

// //   // // edited here: Added auth refresh functionality
// //   // const refreshAuth = useCallback(async () => {
// //   //   try {
// //   //     const token = localStorage.getItem(AUTH_STORAGE_KEY);
// //   //     if (!token) {
// //   //       setState((prev) => ({ ...prev, isLoading: false }));
// //   //       return;
// //   //     }

// //   //     const data = await apiCall("/me");

// //   //     setState((prev) => ({
// //   //       ...prev,
// //   //       user: data.user,
// //   //       isAuthenticated: true,
// //   //       isLoading: false,
// //   //     }));
// //   //   } catch (error) {
// //   //     console.error("Auth refresh failed:", error);
// //   //     clearTokens();
// //   //     setState({
// //   //       user: null,
// //   //       isAuthenticated: false,
// //   //       isLoading: false,
// //   //       error: null,
// //   //     });
// //   //   }
// //   // }, [apiCall, clearTokens]);

// //   // useEffect(() => {
// //   //   refreshAuth();
// //   // }, [refreshAuth]);

// //   // useEffect(() => {
// //   //   if (!state.isAuthenticated) return;
// //   //   const interval = setInterval(() => {
// //   //     refreshAuth();
// //   //   }, 14 * 60 * 1000);
// //   //   return () => clearInterval(interval);
// //   // }, [state.isAuthenticated, refreshAuth]);

// //   // const isAuthenticated = !!user;
// //   // const checkAuth = async (): Promise<boolean> => {
// //   //   try {
// //   //     const response = await fetch("/api/auth/me");
// //   //     if (!response.ok) {
// //   //       setUser(null);
// //   //       setIsLoading(false);
// //   //       return false;
// //   //     }
// //   //     const data = await response.json();
// //   //     setUser(data.user);
// //   //     setIsLoading(false);
// //   //     return true;
// //   //   } catch (error) {
// //   //     console.error("Error checking auth:", error);
// //   //     setUser(null);
// //   //     setIsLoading(false);
// //   //     return false;
// //   //   }
// //   // };

// //   // useEffect(() => {
// //   //   checkAuth();
// //   // }, []);

// //   // const login = async (identifier: string, password: string) => {
// //   //   setIsLoading(true);
// //   //   try {
// //   //     const response = await fetch("/api/auth/login", {
// //   //       method: "POST",
// //   //       headers: {
// //   //         "Content-Type": "application/json",
// //   //       },
// //   //       body: JSON.stringify({ identifier, password }),
// //   //     });

// //   //     if (!response.ok) {
// //   //       const data = await response.json();
// //   //       throw new Error(data.error || data.message || "Login failed");
// //   //     }

// //   //     const data = await response.json();
// //   //     setUser(data.user);
// //   //     router.push("/");
// //   //   } catch (error) {
// //   //     console.error("Error logging in:", error);
// //   //     throw error;
// //   //   } finally {
// //   //     setIsLoading(false);
// //   //   }
// //   // };

// //   // const register = async (
// //   //   username: string,
// //   //   email: string,
// //   //   password: string,
// //   //   role: number
// //   // ) => {
// //   //   setIsLoading(true);
// //   //   try {
// //   //     const response = await fetch("/api/auth/register", {
// //   //       method: "POST",
// //   //       headers: {
// //   //         "Content-Type": "application/json",
// //   //       },
// //   //       body: JSON.stringify({ username, email, password, role }),
// //   //     });

// //   //     if (!response.ok) {
// //   //       const data = await response.json();
// //   //       throw new Error(data.error || "Registration failed");
// //   //     }

// //   //     const data = await response.json();
// //   //     setUser(data.user);
// //   //     router.push("/chat");
// //   //   } catch (error) {
// //   //     console.error("Error registering:", error);
// //   //     throw error;
// //   //   } finally {
// //   //     setIsLoading(false);
// //   //   }
// //   // };

// //   // const logout = async () => {
// //   //   setIsLoading(true);
// //   //   try {
// //   //     await fetch("/api/auth/logout", { method: "POST" });
// //   //     setUser(null);
// //   //     router.push("/auth/login");
// //   //   } catch (error) {
// //   //     console.error("Error logging out:", error);
// //   //   } finally {
// //   //     setIsLoading(false);
// //   //   }
// //   // };

// //   // const contextValue = {
// //   //   user,
// //   //   isLoading,
// //   //   isAuthenticated,
// //   //   login,
// //   //   register,
// //   //   logout,
// //   //   checkAuth,
// //   // };

// //   //   const value: AuthContextType = {
// //   //     ...state,
// //   //     login,
// //   //     logout,
// //   //     register,
// //   //     refreshAuth,
// //   //     clearError,
// //   //   };
// //   //   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// //   return (
// //     <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
// //       {children}
// //     </AuthContext.Provider>
// //   );
// // }

// // export function useAuth() {
// //   const context = useContext(AuthContext);
// //   if (context === undefined) {
// //     throw new Error("useAuth must be used within an AuthProvider");
// //   }
// //   return context;
// // }
