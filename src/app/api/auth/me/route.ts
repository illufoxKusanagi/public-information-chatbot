import { NextRequest, NextResponse } from "next/server";
import {
  ApiError,
  AuthenticatedRequest,
  createAuthMiddleware,
  withMiddleware,
} from "@/middleware/api";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Edited here: Restored your original middleware-based me handler
async function meHandler(req: AuthenticatedRequest) {
  const db = getDb();
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, req.user!.userId))
    .limit(1);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  return NextResponse.json({
    success: true,
    message: "User authenticated",
    data: { user },
  });
}

// Edited here: Your original middleware composition approach
export const GET = (request: NextRequest) => {
  return withMiddleware(createAuthMiddleware())(request, meHandler);
};

// import { NextRequest, NextResponse } from "next/server";
// import { ApiResponse } from "@/lib/types/api";
// import { verifyToken } from "@/lib/services/auth/auth.service";

// // Edited here: Created missing /me endpoint that AuthContext depends on
// export async function GET(request: NextRequest) {
//   try {
//     const token = request.cookies.get("auth-token")?.value;

//     if (!token) {
//       return NextResponse.json<ApiResponse>(
//         {
//           success: false,
//           message: "No authentication token",
//         },
//         { status: 401 }
//       );
//     }

//     const user = await verifyToken(token);

//     return NextResponse.json<ApiResponse>({
//       success: true,
//       message: "User authenticated",
//       data: { user },
//     });
//   } catch (error) {
//     return NextResponse.json<ApiResponse>(
//       {
//         success: false,
//         message: "Invalid token",
//       },
//       { status: 401 }
//     );
//   }
// }

// // TODO : Check this file's code whether it's comprehensive or not

// import { NextRequest, NextResponse } from "next/server";
// import {
//   ApiError,
//   AuthenticatedRequest,
//   createAuthMiddleware,
//   withMiddleware,
// } from "@/middleware/api";
// import { getDb } from "@/lib/db";
// import { users } from "@/lib/db/schema";
// import { eq } from "drizzle-orm";

// async function meHandler(req: AuthenticatedRequest) {
//   // TODO : change into proper get database function in index.ts
//   const db = getDb();
//   const [user] = await db
//     .select({
//       id: users.id,
//       email: users.email,
//       role: users.role,
//       createdAt: users.createdAt,
//     })
//     .from(users)
//     .where(eq(users.id, req.user!.userId)) // TODO: evaluate users schema and request user format
//     .limit(1);
//   if (!user) {
//     throw new ApiError("User not found", 404, "USER_NOT_FOUND");
//   }
//   return NextResponse.json({
//     user: {
//       id: user.id,
//       email: user.email,
//       role: user.role,
//       createdAt: user.createdAt,
//     },
//   });
// }

// export const GET = (req: NextRequest) =>
//   withMiddleware(createAuthMiddleware())(req, meHandler);

// export async function GET(_request: NextRequest) {
//   const token = await getAuthCookie();

//   if (!token) {
//     return NextResponse.json(
//       { error: "Unauthorized" },
//       { status: 401, headers: { "Cache-Control": "no-store" } }
//     );
//   }
//   try {
//     const user = await getUserFromToken(token);
//     if (!user) {
//       clearAuthCookie();
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401, headers: { "Cache-Control": "no-store" } }
//       );
//     }
//     return NextResponse.json(
//       { user },
//       { headers: { "Cache-Control": "no-store" } }
//     );
//   } catch (error) {
//     clearAuthCookie();
//     return NextResponse.json(
//       { error: "Unauthorized" },
//       { status: 401, headers: { "Cache-Control": "no-store" } }
//     );
//   }
// }
