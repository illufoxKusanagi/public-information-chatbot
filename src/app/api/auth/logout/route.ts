import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/services/auth/auth.service";

export async function POST() {
  clearAuthCookie();
  return NextResponse.json({
    message: "Logout berhasil!",
  });
}
