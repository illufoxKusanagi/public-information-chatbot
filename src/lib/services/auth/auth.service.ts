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
type RegisterPayload = Omit<InsertUser, "id" | "createdAt"> & {
  password?: string;
};

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// Edited Here: Fixed TOKEN_EXPIRY to have a default value since your env might be undefined
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || "3h";

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

export function setAuthCookie(token: string) {
  cookies().set({
    name: "auth-token",
    value: token,
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 3,
  });
}

export function getAuthCookie() {
  return cookies().get("auth-token")?.value;
}

export function clearAuthCookie() {
  cookies().delete("auth-token");
}

export async function registerUser(userData: RegisterPayload) {
  const { name, email, password, role } = userData;

  const existingUser = await findUserByEmail(email);
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
      name,
      email,
      password: hashedPassword,
      role,
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

  const user = await findUserByIdentifier(identifier);
  if (!user || !user.password) {
    throw new AuthError("Kredensial tidak valid");
  }

  // Edited Here: Added await to bcrypt.compare since it returns a Promise
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

// import { InsertUser, users } from "@/lib/db/schema";
// import { db, findUserByEmail, findUserByIdentifier } from "@/lib/db/index";
// import { eq, or } from "drizzle-orm";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { cookies } from "next/headers";

// export class AuthError extends Error {
//   constructor(message: string) {
//     super(message);
//     this.name = "AuthError";
//   }
// }

// type LoginPayload = {
//   identifier: string;
//   password: string;
// };

// type RegisterPayload = Omit<InsertUser, "id" | "created_at" | "updated_at"> & {
//   password: string;
// };

// const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY;

// export function generateToken(userId: string): string {
//   return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
// }

// export function verifyToken(token: string): { sub: string } | null {
//   try {
//     return jwt.verify(token, JWT_SECRET) as { sub: string };
//   } catch (error) {
//     return null;
//   }
// }

// export async function getUserFromToken(token: string) {
//   const payload = verifyToken(token);
//   if (!payload) return null;
//   const user = await db.query.users.findFirst({
//     where: (users, { eq }) => eq(users.id, payload.sub),
//     columns: {
//       password: false, // Exclude password from result
//     },
//   });
//   return user || null;
// }

// export function setAuthCookie(token: string) {
//   cookies().set({
//     name: "auth-token",
//     value: token,
//     httpOnly: true,
//     path: "/",
//     secure: process.env.NODE_ENV === "production",
//     maxAge: 60 * 60 * 3, // 1 hour in seconds
//   });
// }

// export function getAuthCookie() {
//   return cookies().get("auth-token")?.value;
// }

// export function clearAuthCookie() {
//   cookies().delete("auth-token");
// }

// export async function registerUser(userData: RegisterPayload) {
//   const { name, email, password, role } = userData;

//   const existingUser = await findUserByEmail(email);
//   if (existingUser) {
//     throw new AuthError("Email telah digunakan, silahkan gunakan email lain.");
//   }
//   if (!password) {
//     throw new AuthError("Password harus diisi.");
//   }

//   const hashedPassword = await bcrypt.hash(password, 10);

//   const newUser = await db
//     .insert(users)
//     .values({
//       name,
//       email,
//       password: hashedPassword,
//       role,
//     })
//     .returning({
//       id: users.id,
//       name: users.name,
//       email: users.email,
//       role: users.role,
//     });
//   const token = generateToken(newUser[0].id);
//   setAuthCookie(token);
//   return newUser[0];
// }

// export async function loginUser(credentials: LoginPayload) {
//   const { identifier, password } = credentials;

//   const user = await findUserByIdentifier(identifier);
//   if (!user || !user.password) {
//     throw new AuthError("Kredensial tidak valid");
//   }
//   const isPasswordValid = bcrypt.compare(password, user.password);
//   if (!isPasswordValid) {
//     throw new AuthError("Password salah, silahkan cek kembali");
//   }
//   const token = generateToken(user.id);
//   setAuthCookie(token);

//   const { password: _, ...userWithoutPassword } = user;
//   return userWithoutPassword;
// }

// export async function logoutUser() {
//   clearAuthCookie();
// }
