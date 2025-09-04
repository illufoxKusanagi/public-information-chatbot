// src/lib/auth/password.ts
import bcrypt from "bcryptjs";
import { authConfig } from "./config";

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, authConfig.BCRYPT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
