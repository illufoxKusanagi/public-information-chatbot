import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/services/auth/auth.service";

const loginSchema = z.object({
  identifier: z.string().min(1, "Masukkan email atau username"),
  password: z.string().min(1, "Masukkan password"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Input tidak valid.",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const user = await loginUser(validation.data);

    return NextResponse.json({
      message: "Login berhasil!",
      user: user,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        {
          // Edited Here: Use 'error' field instead of 'message' for consistency
          error: error.message,
        },
        { status: 401 }
      );
    } else {
      return NextResponse.json(
        {
          error:
            "Server internal mengalami kesalahan, silahkan coba lagi nanti",
        },
        { status: 500 }
      );
    }
  }
}

// // src/app/api/auth/login/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { loginSchema } from "@/lib/validations/auth";
// import { comparePassword, hashPassword } from "@/lib/auth/password";
// import { signToken } from "@/lib/auth/jwt";
// import { authConfig } from "@/lib/auth/config";
// import { findUserByEmail } from "@/lib/services/auth/user.service";
// // Import your user model/database functions

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();

//     // Validate input
//     const result = loginSchema.safeParse(body);
//     if (!result.success) {
//       return NextResponse.json(
//         { error: "Invalid input", details: result.error.issues },
//         { status: 400 }
//       );
//     }

//     const { identifier, password } = result.data;

//     // Find user (implement this based on your database)
//     const user = await findUserByEmail(identifier);
//     if (!user) {
//       return NextResponse.json(
//         { error: "Invalid credentials" },
//         { status: 401 }
//       );
//     }

//     // Hash password
//     const passwordHash = await hashPassword(password);

//     // Verify password
//     const isValidPassword = await comparePassword(password, user.passwordHash);
//     if (!isValidPassword) {
//       return NextResponse.json(
//         { error: "Invalid credentials" },
//         { status: 401 }
//       );
//     }

//     // Generate JWT
//     const token = signToken(user);

//     // Set HTTP-only cookie
//     const cookieStore = cookies();
//     cookieStore.set(authConfig.COOKIE_NAME, token, authConfig.COOKIE_OPTIONS);

//     // Return user data (without password)
//     const { passwordHash, ...userWithoutPassword } = user;

//     return NextResponse.json({
//       user: userWithoutPassword,
//       message: "Login successful",
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// import { z } from "zod";
// import { NextRequest, NextResponse } from "next/server";
// import { loginUser } from "@/lib/services/auth/auth.service";

// const loginSchema = z.object({
//   identifier: z.string().min(1, "Masukkan email atau password"),
//   password: z.string().min(1, "Masukkan password"),
// });

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const validation = loginSchema.safeParse(body);
//     if (!validation.success) {
//       return NextResponse.json(
//         {
//           error: "Input tidak valid.",
//           details: z.flattenError(validation.error),
//         },
//         { status: 400 }
//       );
//     }
//     const user = await loginUser(validation.data);
//     return NextResponse.json({
//       message: "Login berhasil!",
//       user: user,
//     });
//   } catch (error) {
//     if (error instanceof Error) {
//       return NextResponse.json(
//         {
//           message: error.message,
//         },
//         { status: 401 }
//       );
//     } else {
//       return NextResponse.json(
//         {
//           error:
//             "Server internal mengalami kesalahan, silahkan coba lagi nanti",
//         },
//         { status: 500 }
//       );
//     }
//   }
// }
