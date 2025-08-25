import { InsertUser, users } from "@/lib/db/schema";
import { db, findUserByEmail, findUserByIdentifier } from "@/lib/db/index";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

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

type RegisterPayload = Omit<InsertUser, "id" | "created_at" | "updated_at"> & {
  password?: string;
};

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
  return newUser[0];
}

export async function loginUser(credentials: LoginPayload) {
  const { identifier, password } = credentials;
  const user = await findUserByIdentifier(identifier);
  if (!user || !user.password) {
    throw new AuthError("Kredensial tidak valid");
  }
  const isPasswordValid = bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthError("Password salah, silahkan cek kembali");
  }
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
