import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { z } from "zod";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
  };
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createAuthMiddleware() {
  return async (req: AuthenticatedRequest) => {
    try {
      const authHeader = req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        throw new ApiError(
          "Missing or invalid authorization header",
          401,
          "UNAUTHORIZED"
        );
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (payload.type !== "access") {
        throw new ApiError("Invalid token type", 401, "INVALID_TOKEN");
      }

      req.user = {
        userId: payload.userId,
        email: payload.email,
      };

      return req;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Authentication failed", 401, "AUTH_FAILED");
    }
  };
}

// export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
//   return async (req: NextRequest): Promise<T> => {
//     try {
//       const body = await req.json();
//       return schema.parse(body);
//     } catch (error) {
//       if (error instanceof z.ZodError) {
//         throw new ApiError(
//           `Validation failed: ${error}`,
//           400,
//           "VALIDATION_ERROR"
//         );
//       }
//       throw new ApiError("Invalid request body", 400, "INVALID_BODY");
//     }
//   };
// }

export function createValidationMiddleware<T>(
  schema: z.ZodSchema<T>,
  options: { field?: "body" | "query" | "params" } = { field: "body" }
) {
  return async (req: NextRequest): Promise<NextRequest> => {
    try {
      let dataToValidate;

      switch (options.field) {
        case "query":
          const url = new URL(req.url);
          dataToValidate = Object.fromEntries(url.searchParams.entries());
          break;
        case "params":
          dataToValidate = {};
          break;
        case "body":
        default:
          try {
            dataToValidate = await req.json();
            // Edited here: Add debug logging
            console.log("[VALIDATION] Raw data received:", dataToValidate);
          } catch (error) {
            throw new ApiError(
              "Request body harus berupa JSON yang valid",
              400,
              "INVALID_JSON"
            );
          }
      }

      const validatedData = schema.parse(dataToValidate);

      // Edited here: Add debug logging
      console.log("[VALIDATION] Validated data:", validatedData);

      // Attach validated data to the request object
      (req as any).validatedData = validatedData;

      return req;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Edited here: Add debug logging for validation errors
        console.error("[VALIDATION] Zod validation error:", error);

        // const errorMessages = error.errors.map((err) => ({
        //   field: err.path.join("."),
        //   message: err.message,
        //   code: err.code,
        // }));

        throw new ApiError(
          "Data yang dikirim tidak valid",
          400,
          "VALIDATION_ERROR"
          // errorMessages
        );
      }

      if (error instanceof ApiError) throw error;

      throw new ApiError("Gagal memvalidasi request", 400, "VALIDATION_FAILED");
    }
  };
}

// export function createValidationMiddleware<T>(
//   schema: z.ZodSchema<T>,
//   options: { field?: "body" | "query" | "params" } = { field: "body" }
// ) {
//   return async (req: NextRequest): Promise<NextRequest> => {
//     try {
//       let dataToValidate;

//       switch (options.field) {
//         case "query":
//           const url = new URL(req.url);
//           dataToValidate = Object.fromEntries(url.searchParams.entries());
//           break;
//         case "params":
//           dataToValidate = {};
//           break;
//         case "body":
//         default:
//           try {
//             dataToValidate = await req.json();
//           } catch (error) {
//             throw new ApiError(
//               "Request body harus berupa JSON yang valid",
//               400,
//               "INVALID_JSON"
//             );
//           }
//       }

//       const validatedData = schema.parse(dataToValidate);

//       // Edited here: Attach validated data to the request object
//       (req as any).validatedData = validatedData;

//       return req;
//     } catch (error) {
//       if (error instanceof z.ZodError) {
//         const errorMessages = error.errors.map((err) => ({
//           field: err.path.join("."),
//           message: err.message,
//           code: err.code,
//         }));

//         throw new ApiError(
//           `Data yang dikirim tidak valid: ${errorMessages}`,
//           400,
//           "VALIDATION_ERROR"
//         );
//       }

//       if (error instanceof ApiError) throw error;

//       throw new ApiError("Gagal memvalidasi request", 400, "VALIDATION_FAILED");
//     }
//   };
// }

export function createRateLimitMiddleware(
  maxRequests: number = 60,
  windowMs: number = 60000
) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (req: NextRequest) => {
    // Edited here: Enhanced IP detection for better rate limiting
    const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const resetTime = now + windowMs;

    const current = requests.get(ip);

    if (!current) {
      requests.set(ip, { count: 1, resetTime });
      return;
    }

    if (now > current.resetTime) {
      requests.set(ip, { count: 1, resetTime });
      return;
    }

    if (current.count >= maxRequests) {
      throw new ApiError("Rate limit exceeded", 429, "RATE_LIMIT");
    }

    current.count++;
  };
}

export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: error,
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}

export function withMiddleware(
  ...middlewares: Array<(req: any) => Promise<any>>
) {
  return async (
    req: NextRequest,
    handler: (req: any) => Promise<NextResponse>
  ) => {
    try {
      let processedReq = req;

      for (const middleware of middlewares) {
        processedReq = (await middleware(processedReq)) || processedReq;
      }

      return await handler(processedReq);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export const commonMiddleware = {
  // For public endpoints with just rate limiting
  public: (rateLimit?: { maxRequests?: number; windowMs?: number }) => [
    createRateLimitMiddleware(rateLimit?.maxRequests, rateLimit?.windowMs),
  ],

  // For authenticated endpoints
  authenticated: (rateLimit?: { maxRequests?: number; windowMs?: number }) => [
    createRateLimitMiddleware(rateLimit?.maxRequests, rateLimit?.windowMs),
    createAuthMiddleware(),
  ],

  // For admin-only endpoints
  admin: (rateLimit?: { maxRequests?: number; windowMs?: number }) => [
    createRateLimitMiddleware(rateLimit?.maxRequests, rateLimit?.windowMs),
    createAuthMiddleware(),
  ],

  // For endpoints with validation
  validated: <T>(
    schema: z.ZodSchema<T>,
    auth = false,
    rateLimit?: { maxRequests?: number; windowMs?: number }
  ) => [
    createRateLimitMiddleware(rateLimit?.maxRequests, rateLimit?.windowMs),
    ...(auth ? [createAuthMiddleware()] : []),
    createValidationMiddleware(schema),
  ],
};

// import { NextRequest, NextResponse } from "next/server";
// import { verifyToken } from "@/lib/auth/jwt";
// import z from "zod";

// export class ApiError extends Error {
//   constructor(
//     message: string,
//     public status: number = 500,
//     public code?: string
//   ) {
//     super(message);
//     this.name = "ApiError";
//   }
// }

// export interface AuthenticatedRequest extends NextRequest {
//   user?: {
//     userId: string;
//     email: string;
//     type: string;
//   };
// }

// type MiddlewareFunction = (
//   request: NextRequest,
//   handler: (req: any) => Promise<NextResponse>
// ) => Promise<NextResponse>;

// // Edited here: Your withMiddleware function that composes multiple middleware
// export function withMiddleware(...middlewares: MiddlewareFunction[]) {
//   return (
//     request: NextRequest,
//     handler: (req: any) => Promise<NextResponse>
//   ) => {
//     const executeMiddleware = async (
//       index: number,
//       req: NextRequest
//     ): Promise<NextResponse> => {
//       if (index >= middlewares.length) {
//         return handler(req);
//       }

//       return middlewares[index](req, (nextReq) =>
//         executeMiddleware(index + 1, nextReq)
//       );
//     };

//     return executeMiddleware(0, request);
//   };
// }

// // Edited here: Your rate limiting middleware
// export function createRateLimitMiddleware(
//   maxRequests: number,
//   windowMs: number
// ): MiddlewareFunction {
//   const requests = new Map<string, { count: number; resetTime: number }>();

//   return async (
//     request: NextRequest,
//     next: (req: NextRequest) => Promise<NextResponse>
//   ) => {
//     const ip =
//       request.ip || request.headers.get("x-forwarded-for") || "anonymous";
//     const now = Date.now();

//     const userRequests = requests.get(ip);

//     if (!userRequests || now > userRequests.resetTime) {
//       requests.set(ip, { count: 1, resetTime: now + windowMs });
//       return next(request);
//     }

//     if (userRequests.count >= maxRequests) {
//       return NextResponse.json(
//         { success: false, message: "Too many requests" },
//         { status: 429 }
//       );
//     }

//     userRequests.count++;
//     return next(request);
//   };
// }

// // Edited here: Your validation middleware
// export function createValidationMiddleware<T>(
//   schema: z.ZodType<T>
// ): MiddlewareFunction {
//   return async (
//     request: NextRequest,
//     next: (req: NextRequest) => Promise<NextResponse>
//   ) => {
//     try {
//       const body = await request.json();
//       schema.parse(body);

//       // Create new request with parsed body
//       const newRequest = new Request(request.url, {
//         method: request.method,
//         headers: request.headers,
//         body: JSON.stringify(body),
//       }) as NextRequest;

//       return next(newRequest);
//     } catch (error: any) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Validation failed",
//           errors: error.errors || [error.message],
//         },
//         { status: 400 }
//       );
//     }
//   };
// }

// // Edited here: Your auth middleware
// export function createAuthMiddleware(): MiddlewareFunction {
//   return async (
//     request: NextRequest,
//     next: (req: AuthenticatedRequest) => Promise<NextResponse>
//   ) => {
//     try {
//       const authHeader = request.headers.get("authorization");
//       const token = authHeader?.startsWith("Bearer ")
//         ? authHeader.slice(7)
//         : null;

//       if (!token) {
//         return NextResponse.json(
//           { success: false, message: "Missing authorization token" },
//           { status: 401 }
//         );
//       }

//       const payload = verifyToken(token);

//       // Add user info to request
//       const authenticatedRequest = request as AuthenticatedRequest;
//       authenticatedRequest.user = {
//         userId: payload.userId,
//         email: payload.email,
//         type: payload.type,
//       };

//       return next(authenticatedRequest);
//     } catch (error) {
//       return NextResponse.json(
//         { success: false, message: "Invalid token" },
//         { status: 401 }
//       );
//     }
//   };
// }

// export function handleApiError(error: unknown): NextResponse {
//   console.error("API Error:", error);

//   if (error instanceof ApiError) {
//     return NextResponse.json(
//       { error: error.message, code: error.code },
//       { status: error.status }
//     );
//   }

//   if (error instanceof z.ZodError) {
//     return NextResponse.json(
//       {
//         error: "Validation failed",
//         details: error,
//         code: "VALIDATION_ERROR",
//       },
//       { status: 400 }
//     );
//   }

//   return NextResponse.json(
//     { error: "Internal server error", code: "INTERNAL_ERROR" },
//     { status: 500 }
//   );
// }

// // import { NextRequest, NextResponse } from "next/server";
// // import { verifyToken } from "@/lib/auth/jwt";
// // import { z } from "zod";

// // export interface AuthenticatedRequest extends NextRequest {
// //   user?: {
// //     userId: string;
// //     email: string;
// //   };
// // }

// // export class ApiError extends Error {
// //   constructor(
// //     public message: string,
// //     public statusCode: number = 500,
// //     public code?: string
// //   ) {
// //     super(message);
// //     this.name = "ApiError";
// //   }
// // }

// // export function createAuthMiddleware() {
// //   return async (req: AuthenticatedRequest) => {
// //     try {
// //       const authHeader = req.headers.get("authorization");
// //       if (!authHeader?.startsWith("Bearer ")) {
// //         throw new ApiError(
// //           "Missing or invalid authorization header",
// //           401,
// //           "UNAUTHORIZED"
// //         );
// //       }

// //       const token = authHeader.substring(7);
// //       const payload = verifyToken(token);

// //       if (payload.type !== "access") {
// //         throw new ApiError("Invalid token type", 401, "INVALID_TOKEN");
// //       }

// //       req.user = {
// //         userId: payload.userId,
// //         email: payload.email,
// //       };

// //       return req;
// //     } catch (error) {
// //       if (error instanceof ApiError) throw error;
// //       throw new ApiError("Authentication failed", 401, "AUTH_FAILED");
// //     }
// //   };
// // }

// // export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
// //   return async (req: NextRequest): Promise<T> => {
// //     try {
// //       const body = await req.json();
// //       return schema.parse(body);
// //     } catch (error) {
// //       if (error instanceof z.ZodError) {
// //         throw new ApiError(
// //           `Validation failed: ${error}`,
// //           400,
// //           "VALIDATION_ERROR"
// //         );
// //       }
// //       throw new ApiError("Invalid request body", 400, "INVALID_BODY");
// //     }
// //   };
// // }

// // export function createRateLimitMiddleware(
// //   maxRequests: number = 60,
// //   windowMs: number = 60000
// // ) {
// //   const requests = new Map<string, { count: number; resetTime: number }>();

// //   return async (req: NextRequest) => {
// //     // TODO: consider to check req.ip whether it's possible or not
// //     const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown";
// //     const now = Date.now();
// //     const resetTime = now + windowMs;

// //     const current = requests.get(ip);

// //     if (!current) {
// //       requests.set(ip, { count: 1, resetTime });
// //       return;
// //     }

// //     if (now > current.resetTime) {
// //       requests.set(ip, { count: 1, resetTime });
// //       return;
// //     }

// //     if (current.count >= maxRequests) {
// //       throw new ApiError("Rate limit exceeded", 429, "RATE_LIMIT");
// //     }

// //     current.count++;
// //   };
// // }

// // export function handleApiError(error: unknown): NextResponse {
// //   console.error("API Error:", error);

// //   if (error instanceof ApiError) {
// //     return NextResponse.json(
// //       { error: error.message, code: error.code },
// //       { status: error.statusCode }
// //     );
// //   }

// //   if (error instanceof z.ZodError) {
// //     return NextResponse.json(
// //       {
// //         error: "Validation failed",
// //         details: error,
// //         code: "VALIDATION_ERROR",
// //       },
// //       { status: 400 }
// //     );
// //   }

// //   return NextResponse.json(
// //     { error: "Internal server error", code: "INTERNAL_ERROR" },
// //     { status: 500 }
// //   );
// // }

// // export function withMiddleware(
// //   ...middlewares: Array<(req: any) => Promise<any>>
// // ) {
// //   return async (
// //     req: NextRequest,
// //     handler: (req: any) => Promise<NextResponse>
// //   ) => {
// //     try {
// //       let processedReq = req;

// //       for (const middleware of middlewares) {
// //         processedReq = (await middleware(processedReq)) || processedReq;
// //       }

// //       return await handler(processedReq);
// //     } catch (error) {
// //       return handleApiError(error);
// //     }
// //   };
// // }
