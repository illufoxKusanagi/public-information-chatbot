import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ApiError,
  createRateLimitMiddleware,
  createValidationMiddleware,
  withMiddleware,
} from "@/middleware/api";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { generateTokens } from "@/lib/auth/jwt";

const registerSchema = z.object({
  email: z.email("Invalid email format").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
});

// Edited here: Restored your original middleware-based register handler
async function registerHandler(request: NextRequest & { validatedData?: any }) {
  const { email, password, username } = request.validatedData || {};
  if (!email || !password || !username) {
    throw new ApiError(
      "Data registrasi tidak lengkap",
      400,
      "MISSING_REQUIRED_FIELDS"
      // {
      //   received: {
      //     email: !!email,
      //     password: !!password,
      //     username: !!username,
      //   },
      // }
    );
  }
  const db = getDb();

  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    throw new ApiError("Email already registered", 409);
  }

  // Check if username exists
  const [existingUsername] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existingUsername) {
    throw new ApiError("Username already taken", 409);
  }

  const hashedPassword = await hashPassword(password);

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      username,
      password: hashedPassword,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  const { accessToken, refreshToken } = generateTokens(
    newUser.id,
    newUser.email
    // newUser.role
  );

  const response = NextResponse.json(
    {
      success: true,
      message: "Registration successful",
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
        },
        accessToken,
      },
    },
    { status: 201 }
  );

  // Set refresh token as HTTP-only cookie
  response.cookies.set("refresh-token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return response;
}

export const POST = (request: NextRequest) => {
  return withMiddleware(
    createRateLimitMiddleware(3, 600000), // 3 requests per 10 minutes for registration
    createValidationMiddleware(registerSchema)
  )(request, registerHandler);
};

// import { registerUser } from "@/lib/services/auth/auth.service";
// import { findByEmail } from "@/lib/services/auth/user.service";
// import { ApiError, ApiResponse } from "@/lib/types/api";
// import { registerSchema } from "@/lib/validations/auth";
// import { NextRequest, NextResponse } from "next/server";
// import z from "zod";

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const validatedData = registerSchema.parse(body);
//     const existingUser = await findByEmail(validatedData.email);
//     if (existingUser) {
//       throw new ApiError("Email already registered", 409);
//     }
//     const result = await registerUser({
//       name: validatedData.name,
//       email: validatedData.email,
//       password: validatedData.password,
//       confirmPassword: validatedData.confirmPassword,
//     });

//     return NextResponse.json<ApiResponse>(
//       {
//         success: true,
//         message: "Registration successful",
//         data: {
//           user: {
//             name: result.user.name,
//             email: result.user.email,
//             role: result.user.role,
//           },
//         },
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     // Edited here: Comprehensive error handling
//     if (error instanceof z.ZodError) {
//       return NextResponse.json<ApiResponse>(
//         {
//           success: false,
//           message: "Invalid input data",
//           error: error,
//         },
//         { status: 400 }
//       );
//     }
//     if (error instanceof ApiError) {
//       return NextResponse.json<ApiResponse>(
//         {
//           success: false,
//           message: error.message,
//         },
//         { status: error.status }
//       );
//     }
//     console.error("Registration error:", error);
//     return NextResponse.json<ApiResponse>(
//       {
//         success: false,
//         message: "Internal server error",
//       },
//       { status: 500 }
//     );
//   }
// }

// // import { NextRequest, NextResponse } from "next/server";
// // import { z } from "zod";
// // import { registerUser } from "@/lib/services/auth/auth.service";
// // import {
// //   ApiError,
// //   createRateLimitMiddleware,
// //   createValidationMiddleware,
// //   withMiddleware,
// // } from "@/middleware/api";
// // import { getDb } from "@/lib/db";
// // import { users } from "@/lib/db/schema";
// // import { eq } from "drizzle-orm";
// // import { hashPassword } from "@/lib/auth/password";
// // import { generateTokens } from "@/lib/auth/jwt";

// // // Edited Here: Updated schema to match your frontend form
// // const registerSchema = z.object({
// //   email: z.email("Invalid email format").toLowerCase(),
// //   password: z.string().min(8),
// //   // add this whenever it's necessary
// //   // .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),

// //   username: z
// //     .string()
// //     .min(4, "Username must be at least 4 characters")
// //     .max(35, "Username is too long")
// //     .trim(),
// // });

// // async function registerHandler(request: NextRequest) {
// //   const validateMiddleware = createValidationMiddleware(registerSchema);
// //   const { email, password, username } = await validateMiddleware(request);

// //   const db = getDb();

// //   const [existingUser] = await db
// //     .select()
// //     .from(users)
// //     .where(eq(users.email, email))
// //     .limit(1);
// //   if (existingUser) {
// //     throw new ApiError("Email already taken, try another email");
// //   }

// //   const hashedPassword = await hashPassword(password);

// //   try {
// //     const [newUser] = await db
// //       .insert(users)
// //       .values({
// //         email,
// //         password: hashedPassword,
// //         name: username,
// //         // role: 2, // edited here: Default role assignment or use number instead
// //         createdAt: new Date(),
// //       })
// //       .returning({
// //         id: users.id,
// //         email: users.email,
// //         name: users.name,
// //         role: users.role,
// //       });
// //     const { accessToken, refreshToken } = generateTokens(
// //       newUser.id,
// //       newUser.email
// //     );
// //     return NextResponse.json({
// //       user: newUser,
// //       accessToken,
// //       refreshToken,
// //     });
// //   } catch (error) {
// //     console.error("Registration failed", 500, "REGISTRATION_ERROR");
// //   }
// // }

// // export const POST = (req: NextRequest) =>
// //   withMiddleware(createRateLimitMiddleware(3, 600000))(req, registerHandler);
// // export async function POST(request: NextRequest) {
// //   try {
// //     const body = await request.json();
// //     const validation = registerSchema.safeParse(body);

// //     if (!validation.success) {
// //       return NextResponse.json(
// //         {
// //           error: "Input tidak valid.",
// //           details: validation.error.flatten(),
// //         },
// //         { status: 400 }
// //       );
// //     }

// //     const { username, email, password } = validation.data;

// //     const newUser = await registerUser({
// //       name: username,
// //       email,
// //       password,
// //     });

// //     return NextResponse.json(
// //       {
// //         message: "Berhasil membuat akun!",
// //         user: newUser,
// //       },
// //       { status: 201 }
// //     );
// //   } catch (error) {
// //     if (error instanceof Error) {
// //       return NextResponse.json({ error: error.message }, { status: 400 });
// //     } else {
// //       return NextResponse.json(
// //         { error: "Internal server error occurred" },
// //         { status: 500 }
// //       );
// //     }
// //   }
// // }

// // // // src/app/api/auth/register/route.ts
// // // import { NextRequest, NextResponse } from "next/server";
// // // import { cookies } from "next/headers";
// // // import { registerSchema } from "@/lib/validations/auth";
// // // import { hashPassword } from "@/lib/auth/password";
// // // import { signToken } from "@/lib/auth/jwt";
// // // import { authConfig } from "@/lib/auth/config";
// // // import { findUserByEmail } from "@/lib/services/auth/user.service";
// // // import { registerUser } from "@/lib/services/auth/auth.service";

// // // export async function POST(request: NextRequest) {
// // //   try {
// // //     const body = await request.json();

// // //     // Validate input
// // //     const result = registerSchema.safeParse(body);
// // //     if (!result.success) {
// // //       return NextResponse.json(
// // //         { error: "Invalid input", details: result.error.issues },
// // //         { status: 400 }
// // //       );
// // //     }

// // //     const { name, email, password } = result.data;

// // //     // Check if user already exists
// // //     const existingUser = await findUserByEmail(email);
// // //     if (existingUser) {
// // //       return NextResponse.json(
// // //         { error: "User already exists" },
// // //         { status: 409 }
// // //       );
// // //     }

// // //     // Hash password
// // //     const passwordHash = await hashPassword(password);

// // //     // Create user
// // //     const user = await registerUser({
// // //       name,
// // //       email,
// // //       password: passwordHash,
// // //       role: 2, // Default role as 'user'
// // //     });

// // //     // Generate JWT
// // //     const token = signToken(user);

// // //     // Set HTTP-only cookie
// // //     const cookieStore = cookies();
// // //     cookieStore.set(authConfig.COOKIE_NAME, token, authConfig.COOKIE_OPTIONS);

// // //     // Return user data
// // //     const { passwordHash: _, ...userWithoutPassword } = user;

// // //     return NextResponse.json(
// // //       {
// // //         user: userWithoutPassword,
// // //         message: "Registration successful",
// // //       },
// // //       { status: 201 }
// // //     );
// // //   } catch (error) {
// // //     console.error("Registration error:", error);
// // //     return NextResponse.json(
// // //       { error: "Internal server error" },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }

// // // // import { UserRole } from "@/lib/definitions";
// // // // import { NextRequest, NextResponse } from "next/server";
// // // // import { z } from "zod";
// // // // import { registerUser } from "@/lib/services/auth/auth.service";

// // // // // Re-use the same Zod schema for backend validation
// // // // const registerSchema = z.object({
// // // //   username: z.string().min(4).max(20),
// // // //   email: z.email(),
// // // //   password: z.string().min(8),
// // // //   role: z.enum(UserRole).optional(),
// // // // });

// // // // export async function POST(request: NextRequest) {
// // // //   try {
// // // //     const body = await request.json();
// // // //     const validation = registerSchema.safeParse(body);
// // // //     if (!validation.success) {
// // // //       return NextResponse.json(
// // // //         {
// // // //           error: "Input tidak valid. ",
// // // //           details: z.flattenError(validation.error),
// // // //         },
// // // //         { status: 400 }
// // // //       );
// // // //     }
// // // //     const { username, email, password, role } = validation.data;
// // // //     const newUser = await registerUser({
// // // //       name: username,
// // // //       email,
// // // //       password,
// // // //       role,
// // // //     });

// // // //     return NextResponse.json(
// // // //       {
// // // //         message: "Berhasil membuat akun!",
// // // //         user: newUser,
// // // //       },
// // // //       { status: 201 }
// // // //     );
// // // //   } catch (error) {
// // // //     if (error instanceof Error) {
// // // //       return NextResponse.json({ error: error.message }, { status: 400 });
// // // //     } else {
// // // //       return NextResponse.json(
// // // //         { error: "Internal server error occured" },
// // // //         { status: 500 }
// // // //       );
// // // //     }
// // // //   }
// // // // }

// // dsadas
