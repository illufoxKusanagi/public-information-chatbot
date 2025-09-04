import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const publicRoutes = ["/auth/login", "/auth/register"];

const publicApiRoutes = ["/api/auth/login", "/api/auth/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/")) {
    if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.next();
    }
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        jwt.verify(token, JWT_SECRET);
        return NextResponse.next();
      } catch (error) {}
    }
  }
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    if (!pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    jwt.verify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/auth/login", request.url));

    response.cookies.delete("auth-token");
    return response;
  }
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
