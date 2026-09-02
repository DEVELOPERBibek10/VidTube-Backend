import type { CookieOptions } from "express";

export const accessTokenOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  maxAge: 24 * 60 * 60 * 1000,
  sameSite: "none",
};

export const refreshTokenOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  maxAge: 8 * 24 * 60 * 60 * 1000,
  sameSite: "none",
};
