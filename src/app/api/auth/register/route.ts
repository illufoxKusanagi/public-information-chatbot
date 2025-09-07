import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/lib/services/auth/auth.service";

// Edited Here: Updated schema to match your frontend form
const registerSchema = z.object({
  username: z.string().min(4).max(20),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Input tidak valid.",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { username, email, password } = validation.data;

    const newUser = await registerUser({
      name: username,
      email,
      password,
    });

    return NextResponse.json(
      {
        message: "Berhasil membuat akun!",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      return NextResponse.json(
        { error: "Internal server error occurred" },
        { status: 500 }
      );
    }
  }
}

// // src/app/api/auth/register/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { registerSchema } from "@/lib/validations/auth";
// import { hashPassword } from "@/lib/auth/password";
// import { signToken } from "@/lib/auth/jwt";
// import { authConfig } from "@/lib/auth/config";
// import { findUserByEmail } from "@/lib/services/auth/user.service";
// import { registerUser } from "@/lib/services/auth/auth.service";

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();

//     // Validate input
//     const result = registerSchema.safeParse(body);
//     if (!result.success) {
//       return NextResponse.json(
//         { error: "Invalid input", details: result.error.issues },
//         { status: 400 }
//       );
//     }

//     const { name, email, password } = result.data;

//     // Check if user already exists
//     const existingUser = await findUserByEmail(email);
//     if (existingUser) {
//       return NextResponse.json(
//         { error: "User already exists" },
//         { status: 409 }
//       );
//     }

//     // Hash password
//     const passwordHash = await hashPassword(password);

//     // Create user
//     const user = await registerUser({
//       name,
//       email,
//       password: passwordHash,
//       role: 2, // Default role as 'user'
//     });

//     // Generate JWT
//     const token = signToken(user);

//     // Set HTTP-only cookie
//     const cookieStore = cookies();
//     cookieStore.set(authConfig.COOKIE_NAME, token, authConfig.COOKIE_OPTIONS);

//     // Return user data
//     const { passwordHash: _, ...userWithoutPassword } = user;

//     return NextResponse.json(
//       {
//         user: userWithoutPassword,
//         message: "Registration successful",
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Registration error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// import { UserRole } from "@/lib/definitions";
// import { NextRequest, NextResponse } from "next/server";
// import { z } from "zod";
// import { registerUser } from "@/lib/services/auth/auth.service";

// // Re-use the same Zod schema for backend validation
// const registerSchema = z.object({
//   username: z.string().min(4).max(20),
//   email: z.email(),
//   password: z.string().min(8),
//   role: z.enum(UserRole).optional(),
// });

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const validation = registerSchema.safeParse(body);
//     if (!validation.success) {
//       return NextResponse.json(
//         {
//           error: "Input tidak valid. ",
//           details: z.flattenError(validation.error),
//         },
//         { status: 400 }
//       );
//     }
//     const { username, email, password, role } = validation.data;
//     const newUser = await registerUser({
//       name: username,
//       email,
//       password,
//       role,
//     });

//     return NextResponse.json(
//       {
//         message: "Berhasil membuat akun!",
//         user: newUser,
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     if (error instanceof Error) {
//       return NextResponse.json({ error: error.message }, { status: 400 });
//     } else {
//       return NextResponse.json(
//         { error: "Internal server error occured" },
//         { status: 500 }
//       );
//     }
//   }
// }
