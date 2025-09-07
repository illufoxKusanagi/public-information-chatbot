// src/lib/auth/jwt.ts
import jwt from "jsonwebtoken";
import { authConfig } from "./config";
import { User } from "../types/auth";

// if (
//   process.env.NODE_ENV === "production" &&
//   (!authConfig.JWT_SECRET || authConfig.JWT_SECRET === "your-secret-key")
// ) {
//   throw new Error("JWT secret is misconfigured for production.");
// }
if (process.env.NODE_ENV === "production") {
  const s = authConfig.JWT_SECRET;
  if (
    !s ||
    s === "your-secret-key" ||
    s === "dev-insecure-secret" ||
    s.length < 32
  ) {
    throw new Error("JWT secret is misconfigured for production.");
  }
}
export interface JWTPayload {
  sub: string;
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export const signToken = (user: User): string => {
  const payload = {
    sub: user.id,
    userId: user.id,
    email: user.email,
  };
  return jwt.sign(payload, authConfig.JWT_SECRET, {
    expiresIn: authConfig.JWT_EXPIRES_IN,
    algorithm: "HS256",
  });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, authConfig.JWT_SECRET, {
      algorithms: ["HS256"],
    }) as JWTPayload;
  } catch (error) {
    return null;
  }
};
