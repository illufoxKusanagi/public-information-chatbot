import bcrypt from "bcryptjs";
import { authConfig } from "./config";
import { createHash } from "crypto";

const normalize = (s: string) => s.normalize("NFKC");
const preHash = (s: string) =>
  createHash("sha256").update(s, "utf-8").digest("base64");

export const hashPassword = async (password: string): Promise<string> => {
  const p = preHash(normalize(password));
  return bcrypt.hash(p, authConfig.BCRYPT_ROUNDS);
};
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  const p = preHash(normalize(password));
  return bcrypt.compare(p, hash);
};
