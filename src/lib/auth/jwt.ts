// src/lib/auth/jwt.ts
import jwt from "jsonwebtoken";
import { authConfig } from "./config";
import { User } from "../types/auth";

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export const signToken = (user: User): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    authConfig.JWT_SECRET,
    {
      expiresIn: authConfig.JWT_EXPIRES_IN,
    }
  );
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, authConfig.JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};
