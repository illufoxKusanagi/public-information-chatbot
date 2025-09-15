import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "my jwt token";
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

export interface JwtPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

// Edited here: Added your generateTokens function that auth routes expect
export function generateTokens(userId: string, email: string) {
  const accessToken = jwt.sign({ userId, email, type: "access" }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(
    { userId, email, type: "refresh" },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    return null;
  }
}

export function refreshAccessToken(refreshToken: string) {
  const decoded = verifyToken(refreshToken);
  if (decoded.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }
  return generateTokens(decoded.userId, decoded.email);
}

// import jwt, { JwtPayload } from "jsonwebtoken";
// import z from "zod";

// const JWT_SECRET = process.env.JWT_SECRET || "my jwt token";
// const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// export function generateToken(
//   payload: Omit<JwtPayload, "iat" | "exp">
// ): string {
//   return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
// }

// export function verifyToken(token: string): JwtPayload {
//   try {
//     return jwt.verify(token, JWT_SECRET) as JwtPayload;
//   } catch (error) {
//     throw new Error("Invali or expired token");
//   }
// }

// export function decodeToken(token: string): JwtPayload | null {
//   try {
//     return jwt.decode(token) as JwtPayload;
//   } catch (error) {
//     return null;
//   }
// }

// // const envSchema = z.object({
// //   JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
// //   JWT_EXPIRES_IN: z.string().default("15m"),
// //   JWT_REFRESH_EXPIdRES_IN: z.string().default("7d"),
// // });

// // const env = envSchema.parse({
// //   JWT_SECRET: process.env.JWT_SECRET,
// //   JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
// //   JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
// // });

// // export const JWT_CONFIG = {
// //   secret: env.JWT_SECRET,
// //   expiresIn: env.JWT_EXPIRES_IN,
// //   refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
// //   algorithm: "HS256" as const,
// // } as const;

// // interface TokenPayload {
// //   userId: string;
// //   email: string;
// //   type: "access" | "refresh";
// //   iat?: number;
// //   exp?: number;
// // }

// // export function generateTokens(userId: string, email: string) {
// //   const accessToken = jwt.sign(
// //     { userId, email, type: "access" },
// //     JWT_CONFIG.secret,
// //     {
// //       expiresIn: JWT_CONFIG.expiresIn,
// //       algorithm: JWT_CONFIG.algorithm,
// //       issuer: "chatbot-portal",
// //       audience: "chatbot-users",
// //     }
// //   );
// //   const refreshToken = jwt.sign(
// //     { userId, email, type: "refresh" },
// //     JWT_CONFIG.secret,
// //     {
// //       expiresIn: JWT_CONFIG.refreshExpiresIn,
// //       algorithm: JWT_CONFIG.algorithm,
// //       issuer: "chatbot-portal",
// //       audience: "chatbot-users",
// //     }
// //   );
// //   return { accessToken, refreshToken };
// // }
// // export function verifyToken(token: string): TokenPayload {
// //   try {
// //     const decoded = jwt.verify(token, JWT_CONFIG.secret, {
// //       algorithms: [JWT_CONFIG.algorithm],
// //       issuer: "chatbot-portal",
// //       audience: "chatbot-users",
// //     }) as TokenPayload;
// //     return decoded;
// //   } catch (error) {
// //     if (error instanceof jwt.TokenExpiredError) {
// //       throw new Error("Token expired");
// //     }
// //     if (error instanceof jwt.JsonWebTokenError) {
// //       throw new Error("Invalid token");
// //     }
// //     throw new Error(`Token verification failed with ${error}`);
// //   }
// // }
// // export function refreshAccessToken(refreshToken: string) {
// //   const decoded = verifyToken(refreshToken);
// //   if (decoded.type !== "refresh") {
// //     throw new Error("Invalid refresh token");
// //   }
// //   return generateTokens(decoded.userId, decoded.email);
// // }

// // if (process.env.NODE_ENV === "production") {
// //   const s = authConfig.JWT_SECRET;
// //   if (
// //     !s ||
// //     s === "your-secret-key" ||
// //     s === "dev-insecure-secret" ||
// //     s.length < 32
// //   ) {
// //     throw new Error("JWT secret is misconfigured for production.");
// //   }
// // }
// // export interface JWTPayload {
// //   sub: string;
// //   userId: string;
// //   email: string;
// //   iat: number;
// //   exp: number;
// // }

// // export const signToken = (user: User): string => {
// //   const payload = {
// //     sub: user.id,
// //     userId: user.id,
// //     email: user.email,
// //   };
// //   return jwt.sign(payload, authConfig.JWT_SECRET, {
// //     expiresIn: authConfig.JWT_EXPIRES_IN,
// //     algorithm: "HS256",
// //   });
// // };

// // export const verifyToken = (token: string): JWTPayload | null => {
// //   try {
// //     return jwt.verify(token, authConfig.JWT_SECRET, {
// //       algorithms: ["HS256"],
// //     }) as JWTPayload;
// //   } catch (error) {
// //     return null;
// //   }
// // };
