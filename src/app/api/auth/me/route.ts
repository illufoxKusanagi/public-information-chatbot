import { NextRequest, NextResponse } from "next/server";
import {
  getAuthCookie,
  getUserFromToken,
  clearAuthCookie,
} from "@/lib/services/auth/auth.service";

export async function GET(request: NextRequest) {
  const token = getAuthCookie();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserFromToken(token);

  if (!user) {
    clearAuthCookie();
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: user,
  });
}
