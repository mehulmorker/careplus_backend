import { Response } from "express";
import { env } from "../config";

/**
 * Cookie names
 */
export const COOKIE_NAMES = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
} as const;

/**
 * Cookie options for secure HTTP-only cookies
 * Supports cross-domain in production (frontend and backend on different domains)
 */
const getCookieOptions = (maxAge: number) => {
  const isProduction = env.NODE_ENV === "production";

  return {
    httpOnly: true, // Prevents JavaScript access (XSS protection)
    secure: isProduction, // Only send over HTTPS in production (required for sameSite: "none")
    sameSite: isProduction ? ("none" as const) : ("lax" as const), // "none" for cross-domain, "lax" for same-domain
    path: "/", // Available across entire site
    maxAge, // Expiration in seconds
    // Note: domain is NOT set - let browser handle it automatically
    // Setting domain explicitly can cause issues with subdomains
  };
};

/**
 * Set access token cookie
 * Short-lived token (15 minutes)
 *
 * @param res - Express response object
 * @param token - Access token string
 */
export const setAccessTokenCookie = (res: Response, token: string): void => {
  // 15 minutes in seconds
  const maxAge = 15 * 60;
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, token, getCookieOptions(maxAge));
};

/**
 * Set refresh token cookie
 * Long-lived token (7 days)
 *
 * @param res - Express response object
 * @param token - Refresh token string
 */
export const setRefreshTokenCookie = (res: Response, token: string): void => {
  // 7 days in seconds
  const maxAge = 7 * 24 * 60 * 60;
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, token, getCookieOptions(maxAge));
};

/**
 * Clear access token cookie
 *
 * @param res - Express response object
 */
export const clearAccessTokenCookie = (res: Response): void => {
  const isProduction = env.NODE_ENV === "production";
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    path: "/",
  });
};

/**
 * Clear refresh token cookie
 *
 * @param res - Express response object
 */
export const clearRefreshTokenCookie = (res: Response): void => {
  const isProduction = env.NODE_ENV === "production";
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    path: "/",
  });
};

/**
 * Clear all authentication cookies
 *
 * @param res - Express response object
 */
export const clearAuthCookies = (res: Response): void => {
  clearAccessTokenCookie(res);
  clearRefreshTokenCookie(res);
};

