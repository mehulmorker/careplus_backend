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
 */
const getCookieOptions = (maxAge: number) => {
  const isProduction = env.NODE_ENV === "production";

  return {
    httpOnly: true, // Prevents JavaScript access (XSS protection)
    secure: isProduction, // Only send over HTTPS in production
    sameSite: "lax" as const, // CSRF protection
    path: "/", // Available across entire site
    maxAge, // Expiration in seconds
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
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};

/**
 * Clear refresh token cookie
 *
 * @param res - Express response object
 */
export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
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

