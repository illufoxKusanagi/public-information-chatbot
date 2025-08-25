import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/services/auth/auth.service";

const loginSchema = z.object({
  identifier: z.string().min(1, "Masukkan email atau password"),
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
          details: z.flattenError(validation.error),
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
          message: error.message,
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
