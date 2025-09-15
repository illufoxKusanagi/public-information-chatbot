import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import {
  ApiError,
  commonMiddleware,
  createRateLimitMiddleware,
  createValidationMiddleware,
  withMiddleware,
} from "@/middleware/api";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { or, eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { generateTokens } from "@/lib/auth/jwt";

const loginSchema = z.object({
  identifier: z.string().min(1, "Masukkan email atau username"),
  password: z.string().min(1, "Masukkan password"),
});

async function loginHandler(request: NextRequest & { validatedData?: any }) {
  const { identifier, password } = request.validatedData;
  if (!identifier || !password) {
    throw new ApiError(
      "Email/username dan password diperlukan",
      400,
      "MISSING_CREDENTIALS"
      // { received: { identifier: !!identifier, password: !!password } }
    );
  }
  const db = getDb();

  // Find user by email or username
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, identifier), eq(users.username, identifier)))
    .limit(1);

  if (!user) {
    throw new ApiError("Invalid credentials", 401);
  }

  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError("Invalid credentials", 401);
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.email);

  await db
    .update(users)
    .set({ lastLogin: new Date() })
    .where(eq(users.id, user.id));

  const response = NextResponse.json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken,
    },
  });

  // Set refresh token as HTTP-only cookie
  response.cookies.set("refresh-token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return response;
}

// Edited here: Your original middleware composition approach
export const POST = (request: NextRequest) => {
  return withMiddleware(
    createRateLimitMiddleware(5, 300000),
    createValidationMiddleware(loginSchema)
  )(request, loginHandler);
};

// import { loginUser } from "@/lib/services/auth/auth.service";
// import { ApiResponse } from "@/lib/types/api";
// import { loginSchema } from "@/lib/validations/auth";
// import { ApiError } from "@google/genai";
// import { NextRequest, NextResponse } from "next/server";
// import z from "zod";

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const validatedData = loginSchema.parse(body);
//     const result = await loginUser(validatedData);

//     const response = NextResponse.json<ApiResponse>({
//       message: "Login successful",
//       data: result,
//       success: true,
//     });

//     // TODO : find result.token issue and fix it
//     response.cookies.set("auth-token", result.token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 60 * 60 * 24 * 7,
//     });
//     return response;
//   } catch (error) {
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
//     return NextResponse.json<ApiResponse>(
//       {
//         success: false,
//         message: "Internal server error",
//       },
//       { status: 500 }
//     );
//   }
// }

// // import { z } from "zod";
// // // import { loginSchema } from "@/lib/validations/auth";
// // import { NextRequest, NextResponse } from "next/server";
// // import {
// //   loginUser,
// //   AuthError,
// //   generateToken,
// // } from "@/lib/services/auth/auth.service";
// // import {
// //   ApiError,
// //   createRateLimitMiddleware,
// //   createValidationMiddleware,
// //   withMiddleware,
// // } from "@/middleware/api";
// // import { getDbConnection } from "@/lib/db";
// // import { users } from "@/lib/db/schema";
// // import { and, eq } from "drizzle-orm";
// // import { verifyPassword } from "@/lib/auth/password";
// // import { generateTokens } from "@/lib/auth/jwt";
// // // import { ApiError } from "@google/genai";

// // // const loginSchema = z.object({
// // //   identifier: z.string().min(1, "Masukkan email atau username"),
// // //   password: z.string().min(1, "Masukkan password"),
// // // });

// // const loginSchema = z.object({
// //   email: z.email("Invalid email format").toLowerCase(),
// //   password: z.string().min(1, "Password is required"),
// // });

// // async function loginHandler(req: NextRequest) {
// //   const validationMiddleware = createValidationMiddleware(loginSchema);
// //   const { email, password } = await validationMiddleware(req);

// //   const db = getDbConnection();

// //   const [user] = await db
// //     .select()
// //     .from(users)
// //     .where(and(eq(users.email, email), eq(users.password, password)))
// //     .limit(1);
// //   if (!user) {
// //     throw new ApiError("Invalid credential", 401, "INVALID_CREDENTIALS");
// //   }

// //   const isValidPassword = await verifyPassword(password, user.password);
// //   if (!isValidPassword) {
// //     throw new ApiError("Invalid Credential", 401, "INVALID_CREDENTIALS");
// //   }
// //   const { accessToken, refreshToken } = generateTokens(user.id, user.email);

// //   await db
// //     .update(users)
// //     .set({ lastLogin: new Date() }) // TODO : add lastLogin column or ask ai why i should add this
// //     .where(eq(users.id, user.id));
// // }

// // export const POST = (request: NextRequest) => {
// //   withMiddleware(createRateLimitMiddleware(5, 300000))(request, loginHandler);
// // };

// // export async function POST(request: NextRequest) {
// //   try {
// //     const body = await request.json();
// //     const validation = loginSchema.safeParse(body);

// //     if (!validation.success) {
// //       return NextResponse.json(
// //         {
// //           error: "Input tidak valid.",
// //           details: validation.error.flatten(),
// //         },
// //         { status: 400 }
// //       );
// //     }

// //     const user = await loginUser(validation.data);

// //     return NextResponse.json({
// //       message: "Login berhasil!",
// //       user: user,
// //     });
// //   } catch (error) {
// //     if (error instanceof AuthError) {
// //       return NextResponse.json({ error: error.message }, { status: 401 });
// //     } else {
// //       return NextResponse.json(
// //         {
// //           error:
// //             "Server internal mengalami kesalahan, silahkan coba lagi nanti",
// //         },
// //         { status: 500 }
// //       );
// //     }
// //   }
// // }

// // // src/app/api/auth/login/route.ts
// // import { NextRequest, NextResponse } from "next/server";
// // import { cookies } from "next/headers";
// // import { loginSchema } from "@/lib/validations/auth";
// // import { comparePassword, hashPassword } from "@/lib/auth/password";
// // import { signToken } from "@/lib/auth/jwt";
// // import { authConfig } from "@/lib/auth/config";
// // import { findUserByEmail } from "@/lib/services/auth/user.service";
// // // Import your user model/database functions

// // export async function POST(request: NextRequest) {
// //   try {
// //     const body = await request.json();

// //     // Validate input
// //     const result = loginSchema.safeParse(body);
// //     if (!result.success) {
// //       return NextResponse.json(
// //         { error: "Invalid input", details: result.error.issues },
// //         { status: 400 }
// //       );
// //     }

// //     const { identifier, password } = result.data;

// //     // Find user (implement this based on your database)
// //     const user = await findUserByEmail(identifier);
// //     if (!user) {
// //       return NextResponse.json(
// //         { error: "Invalid credentials" },
// //         { status: 401 }
// //       );
// //     }

// //     // Hash password
// //     const passwordHash = await hashPassword(password);

// //     // Verify password
// //     const isValidPassword = await comparePassword(password, user.passwordHash);
// //     if (!isValidPassword) {
// //       return NextResponse.json(
// //         { error: "Invalid credentials" },
// //         { status: 401 }
// //       );
// //     }

// //     // Generate JWT
// //     const token = signToken(user);

// //     // Set HTTP-only cookie
// //     const cookieStore = cookies();
// //     cookieStore.set(authConfig.COOKIE_NAME, token, authConfig.COOKIE_OPTIONS);

// //     // Return user data (without password)
// //     const { passwordHash, ...userWithoutPassword } = user;

// //     return NextResponse.json({
// //       user: userWithoutPassword,
// //       message: "Login successful",
// //     });
// //   } catch (error) {
// //     console.error("Login error:", error);
// //     return NextResponse.json(
// //       { error: "Internal server error" },
// //       { status: 500 }
// //     );
// //   }
// // }

// // import { z } from "zod";
// // import { NextRequest, NextResponse } from "next/server";
// // import { loginUser } from "@/lib/services/auth/auth.service";

// // const loginSchema = z.object({
// //   identifier: z.string().min(1, "Masukkan email atau password"),
// //   password: z.string().min(1, "Masukkan password"),
// // });

// // export async function POST(request: NextRequest) {
// //   try {
// //     const body = await request.json();
// //     const validation = loginSchema.safeParse(body);
// //     if (!validation.success) {
// //       return NextResponse.json(
// //         {
// //           error: "Input tidak valid.",
// //           details: z.flattenError(validation.error),
// //         },
// //         { status: 400 }
// //       );
// //     }
// //     const user = await loginUser(validation.data);
// //     return NextResponse.json({
// //       message: "Login berhasil!",
// //       user: user,
// //     });
// //   } catch (error) {
// //     if (error instanceof Error) {
// //       return NextResponse.json(
// //         {
// //           message: error.message,
// //         },
// //         { status: 401 }
// //       );
// //     } else {
// //       return NextResponse.json(
// //         {
// //           error:
// //             "Server internal mengalami kesalahan, silahkan coba lagi nanti",
// //         },
// //         { status: 500 }
// //       );
// //     }
// //   }
// // }
