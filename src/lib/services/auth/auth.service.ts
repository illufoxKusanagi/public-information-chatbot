import { InsertUser, users } from "@/lib/db/schema";
import { db, findUserByEmail, findUserByIdentifier } from "@/lib/db/index";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

type LoginPayload = {
  identifier: string;
  password: string;
};

// Edited Here: Fixed type to match your database schema (id is string/uuid, not serial)
// type RegisterPayload = Omit<InsertUser, "id" | "createdAt"> & {
//   password?: string;
// };
type RegisterPayload = Omit<
  InsertUser,
  "id" | "createdAt" | "password" | "role"
> & {
  password: string;
};

const RAW_JWT_SECRET = process.env.JWT_SECRET!;
if (!RAW_JWT_SECRET && process.env.NODE_ENV !== "test") {
  throw new Error("JWT_SECRET must be set");
}
const JWT_SECRET = RAW_JWT_SECRET ?? "test-secret";
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY ?? "3h";

export function generateToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string };
  } catch (error) {
    return null;
  }
}

export async function getUserFromToken(token: string) {
  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, payload.sub),
    columns: {
      password: false,
    },
  });
  return user || null;
}

function parseExpiryToSecond(v: string) {
  const m = /^(\d+)([smhd])$/.exec(v);
  if (!m) return 60 * 60 * 3;
  const n = Number(m[1]);
  const mult = { s: 1, m: 60, h: 3600, d: 86400 } as const;
  return n * mult[m[2] as keyof typeof mult];
}

export function setAuthCookie(token: string) {
  const maxAge = parseExpiryToSecond(TOKEN_EXPIRY);
  cookies().set({
    name: "auth-token",
    value: token,
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
  });
}

export function getAuthCookie() {
  return cookies().get("auth-token")?.value;
}

export function clearAuthCookie() {
  cookies().delete("auth-token");
}

export async function registerUser(userData: RegisterPayload) {
  const { name, email, password } = userData;
  const nameTrimmed = name.trim();
  const emailLowerCase = email.trim().toLowerCase();
  const existingUser = await findUserByEmail(emailLowerCase);
  if (existingUser) {
    throw new AuthError("Email telah digunakan, silahkan gunakan email lain.");
  }
  if (!password) {
    throw new AuthError("Password harus diisi.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await db
    .insert(users)
    .values({
      name: nameTrimmed,
      email: emailLowerCase,
      password: hashedPassword,
      role: 2,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

  const token = generateToken(newUser[0].id);
  setAuthCookie(token);
  return newUser[0];
}

export async function loginUser(credentials: LoginPayload) {
  const { identifier, password } = credentials;
  const newIdentifier = identifier.includes("@")
    ? identifier.trim().toLowerCase()
    : identifier.trim();

  const user = await findUserByIdentifier(newIdentifier);
  if (!user || !user.password) {
    throw new AuthError("Kredensial tidak valid");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthError("Password salah, silahkan cek kembali");
  }

  const token = generateToken(user.id);
  setAuthCookie(token);

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function logoutUser() {
  clearAuthCookie();
}
