import { getChatHistoryTitleWithAuth } from "@/lib/services/ai/rag.service";
import {
  getAuthCookie,
  getUserFromToken,
} from "@/lib/services/auth/auth.service";
import { NextRequest, NextResponse } from "next/server";

// Edited Here: Changed parameter destructuring to match [chatId] file name
export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const token = getAuthCookie();

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Edited Here: Use params.chatId instead of params.id
    const chatIdString = params.chatId;
    console.log("Received chatId parameter:", chatIdString);

    if (!chatIdString || chatIdString.trim() === "") {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    const chatId = parseInt(chatIdString, 10);

    if (isNaN(chatId) || chatId <= 0) {
      console.log("Invalid chatId:", chatIdString, "parsed as:", chatId);
      return NextResponse.json(
        { error: "Invalid chat ID format" },
        { status: 400 }
      );
    }

    console.log("Fetching title for chatId:", chatId, "userId:", user.id);

    const result = await getChatHistoryTitleWithAuth(chatId, user.id);

    if (!result.success) {
      console.log("Failed to get chat title:", result.error);
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes("access denied") ? 403 : 404 }
      );
    }

    return NextResponse.json({ title: result.title });
  } catch (error) {
    console.error("Error fetching chat title:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat title" },
      { status: 500 }
    );
  }
}

// import { getChatHistoryTitleWithAuth } from "@/lib/services/ai/rag.service";
// import {
//   getAuthCookie,
//   getUserFromToken,
// } from "@/lib/services/auth/auth.service";
// import { NextRequest, NextResponse } from "next/server";

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     // Edited Here: Get authenticated user instead of allowing anonymous access
//     const token = getAuthCookie();

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const user = await getUserFromToken(token);

//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const chatId = parseInt(params.id);

//     if (isNaN(chatId)) {
//       return NextResponse.json({ error: "Invalid chat ID" }, { status: 400 });
//     }

//     // Edited Here: Use the authenticated user ID instead of hardcoded value
//     const result = await getChatHistoryTitleWithAuth(chatId, user.id);

//     if (!result.success) {
//       return NextResponse.json(
//         { error: result.error },
//         { status: result.error?.includes("access denied") ? 403 : 404 }
//       );
//     }

//     return NextResponse.json({ title: result.title });
//   } catch (error) {
//     console.error("Error fetching chat title:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch chat title" },
//       { status: 500 }
//     );
//   }
// }

// import { getChatHistoryTitleWithAuth } from "@/lib/services/ai/rag.service";
// import {
//   getAuthCookie,
//   getUserFromToken,
// } from "@/lib/services/auth/auth.service";
// import { NextRequest, NextResponse } from "next/server";

// // For App Router
// export async function GET(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const token = getAuthCookie();
//     if (!token) {
//       return NextResponse.json(
//         { message: "Unauthorized - Tidak ada token" },
//         { status: 401 }
//       );
//     }
//     const user = await getUserFromToken(token);
//     if (!user) {
//       return NextResponse.json(
//         { message: "Unauthorized - Token tidak valid" },
//         { status: 401 }
//       );
//     }
//     const chatId = parseInt(params.id);
//     const result = await getChatHistoryTitleWithAuth(chatId, user.id);
//     if (!result.success) {
//       return NextResponse.json(
//         { error: result.error },
//         { status: result.error?.includes("access denied") ? 403 : 404 }
//       );
//     }

//     return NextResponse.json({ title: result.title });
//   } catch (error) {
//     console.error("API Error:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch chat title" },
//       { status: 500 }
//     );
//   }
// }
