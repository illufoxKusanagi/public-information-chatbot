import { UserRole } from "@/lib/definitions";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/lib/services/auth/auth.service";

// Re-use the same Zod schema for backend validation
const registerSchema = z.object({
  username: z.string().min(4).max(20),
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(UserRole),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input. ", details: z.flattenError(validation.error) },
        { status: 400 }
      );
    }
    const { username, email, password, role } = validation.data;
    const newUser = await registerUser({
      name: username,
      email,
      password,
      role,
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
        { error: "Internal server error occured" },
        { status: 500 }
      );
    }
  }
}
