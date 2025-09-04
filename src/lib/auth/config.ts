// src/lib/auth/config.ts
export const authConfig = {
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
  JWT_EXPIRES_IN: "7d",
  BCRYPT_ROUNDS: 12,
  COOKIE_NAME: "auth-token",
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  },
};

export const publicRoutes = [
  "/",
  "/auth/login",
  "/auth/register",
  "/api/auth/login",
  "/api/auth/register",
];

export const protectedRoutes = ["/chat", "/dashboard", "/profile", "/settings"];
