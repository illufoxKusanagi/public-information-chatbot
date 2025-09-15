import { eq, or } from "drizzle-orm";
import { getDb } from "@/lib/db"; // Edited here: Fixed import
import { users } from "@/lib/db/schema";

export async function findByEmail(email: string) {
  if (!email || typeof email !== "string") {
    return null;
  }
  const db = getDb(); // Edited here: Get db instance
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);

  return result[0] || null;
}

export async function findByUsername(username: string) {
  if (!username || typeof username !== "string") {
    return null;
  }
  const db = getDb(); // Edited here: Get db instance
  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username.trim()))
    .limit(1);

  return result[0] || null;
}

export async function findById(id: string) {
  if (!id || typeof id !== "string") {
    return null;
  }
  const db = getDb(); // Edited here: Get db instance
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result[0] || null;
}

export async function findByIdentifier(identifier: string) {
  // Edited here: Add validation check
  if (!identifier || typeof identifier !== "string") {
    return null;
  }
  const db = getDb();
  const cleanIdentifier = identifier.trim().toLowerCase();

  // Try to find by email or username
  const result = await db
    .select()
    .from(users)
    .where(
      or(
        eq(users.email, cleanIdentifier),
        eq(users.username, identifier.trim())
      )
    )
    .limit(1);
  return result[0] || null;
}

// import { users } from "@/lib/db/schema";
// import { hashPassword, verifyPassword } from "@/lib/auth/password";
// import { eq } from "drizzle-orm";
// import type { User, CreateUserRequest } from "@/lib/types/user";
// import { getDb } from "@/lib/db";

// const db = getDb();

// function validateUserInput(userData: CreateUserRequest) {
//   const errors: string[] = [];

//   if (!userData.email?.trim()) {
//     errors.push("Email is required");
//   }

//   if (!userData.password || userData.password.length < 8) {
//     errors.push("Password must be at least 8 characters");
//   }

//   if (!userData.username?.trim()) {
//     errors.push("Name is required");
//   }

//   if (errors.length > 0) {
//     throw new Error(`Validation failed: ${errors.join(", ")}`);
//   }

//   return {
//     email: userData.email.toLowerCase().trim(),
//     password: userData.password,
//     username: userData.username.trim(),
//     role: userData.role || "user",
//   };
// }

// export async function createUser(
//   userData: CreateUserRequest
// ): Promise<Omit<User, "password">> {
//   try {
//     const validatedData = validateUserInput(userData);
//     const existingUser = await findByEmail(validatedData.email);
//     if (existingUser) {
//       throw new Error("User with this email already exists");
//     }

//     const hashedPassword = await hashPassword(validatedData.password);

//     const [newUser] = await db
//       .insert(users)
//       .values({
//         email: validatedData.email,
//         password: hashedPassword,
//         username: validatedData.username,
//         role: validatedData.role,
//       })
//       .returning({
//         id: users.id,
//         email: users.email,
//         username: users.username,
//         role: users.role,
//         createdAt: users.createdAt,
//       });

//     return newUser;
//   } catch (error) {
//     console.error("❌ Error creating user:", error);
//     throw new Error(
//       `Failed to create user: ${
//         error instanceof Error ? error.message : "Unknown error"
//       }`
//     );
//   }
// }

// export async function verifyUser(
//   email: string,
//   password: string
// ): Promise<Omit<User, "password"> | null> {
//   try {
//     if (!email?.trim() || !password) {
//       throw new Error("Email and password are required");
//     }

//     const user = await db
//       .select()
//       .from(users)
//       .where(eq(users.email, email.toLowerCase().trim()))
//       .limit(1);

//     if (user.length === 0) {
//       return null;
//     }

//     const isValid = await verifyPassword(password, user[0].password);
//     if (!isValid) {
//       return null;
//     }

//     const { password: _, ...userWithoutPassword } = user[0];
//     return userWithoutPassword;
//   } catch (error) {
//     console.error("❌ Error verifying user:", error);
//     throw new Error(
//       `User verification failed: ${
//         error instanceof Error ? error.message : "Unknown error"
//       }`
//     );
//   }
// }

// export const findByEmail = async (email: string): Promise<User | null> => {
//   try {
//     if (!email?.trim()) {
//       return null;
//     }

//     const result = await db
//       .select({
//         id: users.id,
//         email: users.email,
//         username: users.username,
//         role: users!.role,
//         password: users.password,
//         createdAt: users.createdAt,
//       })
//       .from(users)
//       .where(eq(users.email, email.toLowerCase().trim()))
//       .limit(1);

//     return result.length > 0 ? result[0] : null;
//   } catch (error) {
//     console.error("❌ Error finding user by email:", error);
//     return null;
//   }
// };

// export const findById = async (
//   id: string
// ): Promise<Omit<User, "password"> | null> => {
//   try {
//     if (!id?.trim()) {
//       return null;
//     }

//     const result = await db
//       .select({
//         id: users.id,
//         email: users.email,
//         username: users.username,
//         role: users.role,
//         createdAt: users.createdAt,
//       })
//       .from(users)
//       .where(eq(users.id, id))
//       .limit(1);

//     return result.length > 0 ? result[0] : null;
//   } catch (error) {
//     console.error("❌ Error finding user by ID:", error);
//     return null;
//   }
// };

// export async function updateUser(
//   id: string,
//   updates: Partial<CreateUserRequest>
// ): Promise<Omit<User, "password"> | null> {
//   try {
//     if (!id?.trim()) {
//       throw new Error("User ID is required");
//     }

//     const updateData: any = {};

//     if (updates.username?.trim()) {
//       updateData.username = updates.username.trim();
//     }

//     if (updates.email?.trim()) {
//       const existingUser = await findByEmail(updates.email);
//       if (existingUser && existingUser.id !== id) {
//         throw new Error("Email is already in use");
//       }
//       updateData.email = updates.email.toLowerCase().trim();
//     }

//     if (updates.password) {
//       if (updates.password.length < 8) {
//         throw new Error("Password must be at least 8 characters");
//       }
//       updateData.password = await hashPassword(updates.password);
//     }

//     if (updates.role) {
//       updateData.role = updates.role;
//     }

//     if (Object.keys(updateData).length === 0) {
//       throw new Error("No valid updates provided");
//     }

//     const [updatedUser] = await db
//       .update(users)
//       .set(updateData)
//       .where(eq(users.id, id))
//       .returning({
//         id: users.id,
//         email: users.email,
//         username: users.username,
//         role: users.role,
//         createdAt: users.createdAt,
//       });

//     return updatedUser || null;
//   } catch (error) {
//     console.error("❌ Error updating user:", error);
//     throw new Error(
//       `Failed to update user: ${
//         error instanceof Error ? error.message : "Unknown error"
//       }`
//     );
//   }
// }

// export const UserService = {
//   create: createUser,
//   verify: verifyUser,
//   findByEmail,
//   findById,
//   update: updateUser,
// };

// // import { or, eq } from "drizzle-orm";
// // import { db } from "@/lib/db/index";
// // import { users } from "@/lib/db/schema";

// // export async function findUserByIdentifier(identifier: string) {
// //   try {
// //     const user = await db
// //       .select()
// //       .from(users)
// //       .where(or(eq(users.email, identifier), eq(users.name, identifier)));

// //     return user[0] || null;
// //   } catch (error) {
// //     console.error("Error finding user by identifier:", error);
// //     return null;
// //   }
// // }

// // export async function findUserById(id: string) {
// //   const result = await db.select().from(users).where(eq(users.id, id));
// //   return result[0] || null;
// // }

// // export async function findUserByEmail(email: string) {
// //   try {
// //     const user = await db.query.users.findFirst({
// //       where: eq(users.email, email),
// //     });
// //     return user ?? null;
// //   } catch (error) {
// //     console.error("Error finding user by email:", error);
// //     return null;
// //   }
// // }
