import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const staticUser = {
  id: "1",
  username: "Illufox Kasunagi",
  email: "test@gmail.com",
  password: "password",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsedCredentials = loginSchema.safeParse(body);
    if (!parsedCredentials.success) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }
    const { email, password } = parsedCredentials.data;
    if (email !== staticUser.email || password !== staticUser.password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const { password: _, ...user } = staticUser;
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}

// FOR RATE LIMITING
// Uncomment the following code to implement rate limiting

// import { z } from "zod";
// import { NextRequest, NextResponse } from "next/server";

// const loginSchema = z.object({
// // ...existing code...
//   password: "password",
// };

// // Simple in-memory store for rate limiting.
// // In a real production app, use a more persistent store like Redis.
// const loginAttempts = new Map<string, { count: number; expiry: number }>();
// const MAX_ATTEMPTS = 5;
// const LOCKOUT_PERIOD = 15 * 60 * 1000; // 15 minutes

// export async function POST(req: NextRequest) {
//   const ip = req.ip ?? "127.0.0.1";
//   const attempt = loginAttempts.get(ip);

//   if (attempt && attempt.count >= MAX_ATTEMPTS && attempt.expiry > Date.now()) {
//     return NextResponse.json(
//       { error: "Too many failed login attempts. Please try again later." },
//       { status: 429 } // Too Many Requests
//     );
//   }

//   try {
//     const body = await req.json();
// // ...existing code...
//     const { email, password } = parsedCredentials.data;
//     if (email !== staticUser.email || password !== staticUser.password) {
//       // Increment failed attempts for this IP
//       const newCount = (attempt?.count || 0) + 1;
//       loginAttempts.set(ip, { count: newCount, expiry: Date.now() + LOCKOUT_PERIOD });

//       return NextResponse.json(
//         { error: "Invalid email or password" },
//         { status: 401 }
//       );
//     }

//     // On successful login, clear any previous failed attempts for this IP
//     loginAttempts.delete(ip);

//     const { password: _, ...user } = staticUser;
//     return NextResponse.json({ user }, { status: 200 });
//   } catch (error) {
// // ...existing code...
