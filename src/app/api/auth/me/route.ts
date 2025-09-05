import { NextRequest, NextResponse } from "next/server";
import {
  getAuthCookie,
  getUserFromToken,
  clearAuthCookie,
} from "@/lib/services/auth/auth.service";

// export async function GET(request: NextRequest) {
export async function GET(_request: NextRequest) {
  const token = getAuthCookie();

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }
  // delete try catch if it's failed
  try {
    const user = await getUserFromToken(token);
    if (!user) {
      clearAuthCookie();
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { user },
      { headers: { "Cache-Control": "no-store" } }
    );
    // delete this following linex if it's failed
  } catch (error) {
    clearAuthCookie();
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }
}
